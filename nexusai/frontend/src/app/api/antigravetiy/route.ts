import { NextResponse } from "next/server"

const SYSTEM_PROMPT = `You are NexusAI, a helpful and friendly AI assistant on the NexusAI website. Provide concise, accurate answers to user questions about our products and services. Use a warm, empathetic tone. Keep answers short (no more than 3 sentences per main point) and use bullet lists or examples if needed. If you don't know an answer, say 'I'm sorry, I don't have that information.' Do not guess or invent facts. If the user's question falls outside our domain (e.g. legal, medical, personal data), politely decline and suggest contacting support.`

// Helper to pick a random response
function getRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Simulated responses based on keywords to mimic a properly trained agent using real project data
function getMockResponse(message: string): string {
  const lowerMsg = message.toLowerCase()

  if (lowerMsg.match(/\b(hi|hii|hello|hey|greetings)\b/)) {
    return getRandom([
      "Hello there! I'm here to help you understand NexusAI. Feel free to ask about our pricing, features, or how the platform works!",
      "Hi! I'm NexusAI. How can I assist you today?",
      "Hey! Welcome to NexusAI. What would you like to know?"
    ])
  }

  if (lowerMsg.includes("how") && (lowerMsg.includes("work") || lowerMsg.includes("use"))) {
    return getRandom([
      "NexusAI works by securely ingesting your files into an advanced multi-agent RAG pipeline, allowing you to query them instantly. You can upload documents and immediately start chatting with them to extract defensible answers.",
      "It's simple: upload your raw data files to our secure platform, and our AI pipeline indexes them. Then, you can ask questions and instantly get precise answers backed by citations from your own files."
    ])
  }

  if (lowerMsg.includes("what is") && (lowerMsg.includes("nexus") || lowerMsg.includes("this"))) {
    return getRandom([
      "NexusAI is an enterprise AI infrastructure designed to turn raw files into actionable, defensible answers. We provide enterprise-grade security, custom data residency in India, and fast clarity for your workflows.",
      "Think of NexusAI as your secure, highly intelligent knowledge assistant. It reads your private documents and helps you extract insights instantly using a multi-agent RAG pipeline."
    ])
  }

  if (lowerMsg.includes("price") || lowerMsg.includes("cost") || lowerMsg.includes("pricing") || lowerMsg.includes("plan")) {
    return getRandom([
      "Our pricing is simple and in INR. We offer a Free Starter plan. The Pro plan (for professionals & teams) is ₹1,999/month, and the Enterprise plan is ₹4,999/month.",
      "We have three tiers: Starter (Free), Pro (₹1,999/month) with unlimited queries, and Enterprise (₹4,999/month) which includes custom data residency and unlimited API access. We also offer yearly billing with a 20% discount!"
    ])
  }
  
  if (lowerMsg.includes("discount") || lowerMsg.includes("startup") || lowerMsg.includes("ngo") || lowerMsg.includes("student") || lowerMsg.includes("edu")) {
    return "Yes! We offer 40% off on Pro plans for DPIIT-recognised startups, registered NGOs, and .edu/.ac.in institutions. Contact us at support@nexusai.in with your verification documents to apply."
  }
  
  if (lowerMsg.includes("data") || lowerMsg.includes("store") || lowerMsg.includes("privacy") || lowerMsg.includes("host") || lowerMsg.includes("security")) {
    return getRandom([
      "Your data privacy is our top priority. All data is hosted in the AWS Mumbai (ap-south-1) region. Your documents and embeddings never leave Indian soil.",
      "We offer 100% Data Privacy. Your files are encrypted and hosted securely in AWS Mumbai. For Enterprise customers, we even offer dedicated VPC isolation and on-prem deployment options."
    ])
  }
  
  if (lowerMsg.includes("agent") || lowerMsg.includes("pipeline") || lowerMsg.includes("orchestrator") || lowerMsg.includes("critic")) {
    return getRandom([
      "NexusAI uses a unique 5-agent pipeline: an Orchestrator to break down tasks, a Retriever for search, an Analyst to draft, a Critic to score claims (looping back if confidence is below 70%), and a Writer to format citations.",
      "We rely on a multi-agent orchestration system instead of a single prompt. This includes specialized agents like the Critic, which rigorously evaluates answers and loops back to the Analyst if the confidence score drops below 70%."
    ])
  }

  if (lowerMsg.includes("hybrid") || lowerMsg.includes("retrieval") || lowerMsg.includes("search") || lowerMsg.includes("bm25")) {
    return getRandom([
      "We use a Hybrid Retrieval Architecture that blends semantic recall with exact lexical matching (BM25). This ensures that deep technical terms don't vanish inside an embedding-only search.",
      "Our Retriever agent runs a hybrid BM25 + vector search. This combination provides the best of both worlds: understanding the meaning of your question while never missing exact keyword matches."
    ])
  }

  if (lowerMsg.includes("workspace") || lowerMsg.includes("isolate") || lowerMsg.includes("govern")) {
    return "NexusAI features Workspace Isolation. This keeps your documents and answer histories securely partitioned by workspace, allowing for cleaner data governance across your teams."
  }

  if (lowerMsg.includes("analytics") || lowerMsg.includes("observability") || lowerMsg.includes("trend")) {
    return "We offer observability-ready analytics. Our platform surfaces usage trends, document activity, and answer behavior in a robust, control-room style interface."
  }

  if (lowerMsg.includes("citation") || lowerMsg.includes("stream") || lowerMsg.includes("source")) {
    return "NexusAI utilizes cited answer streaming. Our progressive output keeps your review loops moving fast while the system maintains absolute source traceability for every claim it makes."
  }

  if (lowerMsg.includes("human") || lowerMsg.includes("person") || lowerMsg.includes("support")) {
    return getRandom([
      "Certainly. You can reach our support team at support@nexusai.in, or if you are on a Pro/Enterprise plan, you can access priority live chat or your dedicated Slack channel.",
      "I understand you'd like to speak with a human. Please send an email to support@nexusai.in and our team will get back to you right away!"
    ])
  }
  
  if (lowerMsg.includes("illegal") || lowerMsg.includes("medical")) {
    return "I'm sorry, I can't assist with that. You may want to consult a professional or our help center."
  }

  // Generic fallback if no keywords matched
  return getRandom([
    "That's a great question! While I'm still in training and don't have the exact answer right now, our team would love to help. You can reach us at support@nexusai.in.",
    "I'm not completely sure about that just yet. I'm constantly learning! Can I connect you with our support team? Just email support@nexusai.in.",
    "Interesting! I don't have the details on that currently. Let me grab a human agent for you, please email support@nexusai.in."
  ])
}

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastUserMessage = messages[messages.length - 1]?.content || ""

    // In a real implementation with OpenAI:
    // const response = await openai.createChatCompletion({ ... })
    
    // For now, we simulate the LLM response processing delay
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const botReply = getMockResponse(lastUserMessage)

    return NextResponse.json({ reply: botReply })
  } catch (error) {
    console.error("Antigravetiy API Error:", error)
    return NextResponse.json(
      { reply: "I'm sorry, I'm having trouble connecting to my knowledge base right now." },
      { status: 500 }
    )
  }
}
