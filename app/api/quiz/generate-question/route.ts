import { createClient } from '@/lib/supabase/server'; 
import { ChatOpenAI } from "@langchain/openai";
 import { ChatPromptTemplate } from "@langchain/core/prompts"; 
 import { StringOutputParser } from "@langchain/core/output_parsers";
  import { cookies } from 'next/headers'; 
import { NextResponse } from 'next/server';
// types/index.ts
export interface Question {
    question: string;
    options?: string[];
    correctAnswer: string;
  }
  
  // app/api/generate-questions/route.ts
  export async function POST(req: Request) {
    try {
      const { 
        documentId,
        type: questionType,
        difficulty: difficultyLevel,
        topic,
        count: numberOfQuestions,
      } = await req.json();
  
      const cookieStore = cookies();
      const supabase = await createClient(cookieStore);
  
      // Fetch document
      const { data: document, error: fetchError } = await supabase
        .from('documents')
        .select('content, title')
        .eq('id', documentId)
        .single();
  
      if (fetchError || !document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }
  
      const llm = new ChatOpenAI({ model: "gpt-4o", temperature: 0.7 });
  
      const topicContext = topic ? `focusing on the topic: ${topic}` : '';
      const questionPrompt = ChatPromptTemplate.fromTemplate(`
        Generate ${numberOfQuestions} ${difficultyLevel} level ${questionType} questions based on the following content, ${topicContext}.
        Content: {content}
        Open-ended questions must have a correct answer.
        {{Provide correct answer for open-ended questions inside the correctAnswer field.}}
        Open-ended answers maybe different is from the correct answer but look if the answer has any relation to generated answer.
        Always generate questions based on the language of the document.
        If the content is not suitable for generating questions, please provide a reason.
        Only generate questions that are meaningful and relevant to the content.
        Return the response in the following JSON format only, with no additional text or formatting:
        {{
          "questions": [
            {{
              "question": "<question text>",
              "type": "<question type>",
              "id": "<unique question id>",
              "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
              "correctAnswer": "<correct option>"
      }}
          ]

      }}
        `);
        const documentContent = Array.isArray(document.content) 
        ? document.content.join('\n')
        : typeof document.content === 'string' 
          ? document.content
          : JSON.stringify(document.content);
  
      const questionChain = questionPrompt
        .pipe(llm)
        .pipe(new StringOutputParser());
  
      const result = await questionChain.invoke({
        content: documentContent
      });
  
      const cleanResult = result.trim();
      console.log('Cleaned result:', cleanResult);
    let parsedQuestions;
    
    try {
        // Attempt to parse the JSON response
        const jsonString = extractJsonFromString(cleanResult);
        parsedQuestions = JSON.parse(jsonString);
      // Validate structure
      if (!parsedQuestions.questions || !Array.isArray(parsedQuestions.questions)) {
        throw new Error('Invalid response structure');
      }
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      return NextResponse.json(
        { error: 'Failed to parse questions' },
        { status: 500 }
      );
    }
  
      // Store in Supabase
      await supabase.from('document_questions').insert({
        document_id: documentId,
        questions: parsedQuestions,
        metadata: { type: questionType, difficulty: difficultyLevel, topic }
      });
     
      return NextResponse.json(parsedQuestions);
  
    } catch (error) {
      console.error('Error:', error);
      return NextResponse.json(
        { error: 'Failed to generate questions' },
        { status: 500 }
      );
    }
  }
  
  export function extractJsonFromString(str: string): string {
    try {
      // Find JSON-like content between curly braces
      const jsonRegex = /{[\s\S]*}/;
      const match = str.match(jsonRegex);
      
      if (!match) {
        throw new Error('No JSON object found in string');
      }
  
      // Extract the matched JSON string
      const jsonString = match[0];
      
      // Validate it's parseable
      JSON.parse(jsonString);
      
      return jsonString;
    } catch (error) {
      console.error('Error extracting JSON:', error);
      throw error;
    }
  }