import { OpenAIEmbeddings } from "@langchain/openai"
import { createClient } from '@/lib/supabase/client'

export async function createDocument(title: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('documents')
    .insert({ title })
    .select()
    .single()
    
  if (error) throw error
  return data
}

export async function updateDocumentEmbedding(documentId: string, content: string) {
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  })
  const supabase = createClient()
  
  try {
    const embedding = await embeddings.embedQuery(content)
    
    const { error } = await supabase
      .from('document_embeddings')
      .insert({
        document_id: documentId,
        embedding,
        content
      })
    
    if (error) throw error
    
  } catch (error) {
    console.error('Error updating document embedding:', error)
    throw new Error('Failed to update document embedding')
  }
}

export async function searchSimilarDocuments(query: string, limit: number = 5) {
  const embeddings = new OpenAIEmbeddings({
    modelName: "text-embedding-3-small"
  })
  const supabase = createClient()
  
  try {
    const queryEmbedding = await embeddings.embedQuery(query)
    
    const { data, error } = await supabase
      .rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: limit
      })
    
    if (error) throw error
    return data
    
  } catch (error) {
    console.error('Error searching documents:', error)
    throw new Error('Failed to search documents')
  }
}