import { NextResponse } from "next/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { createClient } from "@/lib/supabase/server";
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid';
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { EPubLoader } from "@langchain/community/document_loaders/fs/epub";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import {
  RunnableSequence,
} from "@langchain/core/runnables";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { ChatPromptTemplate } from "@langchain/core/prompts";


export async function POST(req: Request) {
  const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName=formData.get("fileName") as string

  const isPdfFile=file.name.endsWith('.pdf')
  const isDocxFile=file.name.endsWith('.docx')
  const isEpubFile=file.name.endsWith('.epub')
  const isPptxFile=file.name.endsWith('.pptx')
  const isTxtFile=file.name.endsWith('.txt')
  let loader;
  if(isPdfFile){
    loader=new PDFLoader(file)
  }
  if(isDocxFile){
    loader=new DocxLoader(file)
  }

  if(isPptxFile){
    loader=new PPTXLoader(file)
  }
  if(isTxtFile){
    loader=new TextLoader(file)
  }
  const docs = await loader?.load();
  const cookieStore=cookies()
  const supabase= createClient(cookieStore)
  const {data: {user}}=await supabase.auth.getUser()
  
  
  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });

  
  //generate a title for the document
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 0,
  });
  if (!docs) {
    return new Response("No documents found", { status: 400 });
  }
  const chunks = await textSplitter.splitDocuments(docs);
  
  const documentsEmbeddings = await Promise.all(
    chunks.map((chunk) => embeddings.embedQuery(chunk.pageContent))
  );
      const documentId = uuidv4();
  // Retrieve and generate using the relevat snippets of the blog.
  const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0 });
  const titlePromptTemplate = ChatPromptTemplate.fromTemplate(`
    Given the following document content, generate a concise and descriptive title.
    Use key terms and maintain professional tone.
    Generate title based on the language of the document.
    Document Content:
    {context}
    
    Requirements:
    - Keep it under 10 words
    - Use main keywords
    - Make it clear and descriptive
    - Avoid unnecessary words
    
    Generated Title:`);
 
   
   
    // Save the document to the database
    
    const titleChain = RunnableSequence.from([
      {
        context: (input: { context: string }) => input.context,
      },
      titlePromptTemplate,
      llm,
      new StringOutputParser(),
    ]);
    const title = await titleChain.invoke({
      context: chunks[0].pageContent,
    });
    console.log(`Title: ${title}`);
    
    const {data,error}=await supabase.from("documents").insert([
      {
        id: documentId,
        user_id: user?.id,
        content:chunks.map((doc) => doc.pageContent),
        title:title,
        file_url:fileName,
        embedding: documentsEmbeddings[0],
        metadata: {
          chunks: chunks.map(chunk => ({
            ...chunk.metadata,
          })),
          filename: file.name,
          total_chunks: chunks.length
        }
      }
    ]);
    console.log(`Document saved: ${data}`);
    //i want to reduce user's free credit based on the number of pages in the document
    const {data:free_credits}=await supabase.from('users').select('free_credits').eq('id',user?.id).single()
    if(free_credits?.free_credits>0){
      const newCredit=free_credits?.free_credits-1
    const {data:updatedUser,error:updateError}=await supabase.from('users').update({free_credits:newCredit}).eq('id',user?.id).single()
    }
    if(error){
      console.error(error)
      return new Response("Error saving document", { status: 500 });
    }
    
   
  // do something with the extracted text, e.g. return it as a response
  return NextResponse.json({ extractedText: chunks[0].pageContent,title:title });
}