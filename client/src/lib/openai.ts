import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Image analysis function
export async function analyzeGhibliImage(base64Image: string): Promise<{
  diagnosisPoints: string[],
  treatmentPoints: string[],
  contaminationLevel: number
}> {
  try {
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You're an AI physician at the Ghibli Detox Clinic. Analyze the provided image to detect Ghibli-style elements (like Totoro, soot sprites, whimsical landscapes, magical creatures, etc.). Respond with 3 diagnosis points, 3 treatment points, and a contamination level from 1-100."
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image and provide a humorous medical diagnosis of its Ghibli-style contamination. Be creative and funny while providing specific details about what Ghibli elements you detect."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const analysis = JSON.parse(visionResponse.choices[0].message.content);

    return {
      diagnosisPoints: analysis.diagnosisPoints || [],
      treatmentPoints: analysis.treatmentPoints || [],
      contaminationLevel: analysis.contaminationLevel || 50
    };
  } catch (error) {
    throw new Error("Failed to analyze image: " + error.message);
  }
}

// Image generation function
export async function generateDetoxifiedImage(promptText: string): Promise<string> {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: promptText,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return response.data[0].url;
  } catch (error) {
    throw new Error("Failed to generate detoxified image: " + error.message);
  }
}
