import { ChatOpenAI } from "@langchain/openai"
import { PromptTemplate } from "@langchain/core/prompts"
import { RunnableSequence } from "@langchain/core/runnables"
import { StringOutputParser } from "@langchain/core/output_parsers"

const SYSTEM_TEMPLATE = `You are a document analysis assistant. Extract and structure the following content:

Content: {text}

Follow these rules:
1. Preserve the original formatting and structure
2. Extract key information like dates, names, and numbers
3. Maintain hierarchical relationships between sections
4. Remove any redundant or irrelevant information

Output the processed content in a clear, structured format.`

export async function createDocumentChain() {
  const model = new ChatOpenAI({
    temperature: 0,
    modelName: 'gpt-4o',
    streaming: true,
  })

  const prompt = PromptTemplate.fromTemplate(SYSTEM_TEMPLATE)
  
  return RunnableSequence.from([
    prompt,
    model,
    new StringOutputParser()
  ])
}