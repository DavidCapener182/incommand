import OpenAI from 'openai'

const apiKey = process.env.OPENAI_API_KEY?.trim()

export const openaiClient = apiKey ? new OpenAI({ apiKey }) : null

export const isOpenAIConfigured = (): boolean => Boolean(openaiClient)

