import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
  useFileOutput: false
});

function buildPrompt(motionType, prompt) {
  const base =
    "Create a realistic image-to-video animation. Animate only the main subject inside the image. Keep the background stable. Do not move the whole image. Avoid camera movement. Smooth realistic motion. High quality.";

  const motions = {
    wave:
      "The subject gently waves their hand naturally. Keep the face realistic and stable.",
    smile:
      "The subject smiles naturally with subtle facial movement.",
    blink:
      "The subject blinks naturally with subtle lifelike motion.",
    nod:
      "The subject gently nods their head naturally.",
    talk:
      "The subject appears to speak naturally with subtle mouth and facial movement.",
    body:
      "The subject has subtle body movement and natural breathing motion.",
    custom:
      prompt || "The subject moves naturally."
  };

  return `${base} ${motions[motionType] || motions.custom}`;
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        error: "Only POST method is allowed."
      });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return res.status(500).json({
        error: "Missing REPLICATE_API_TOKEN in Vercel Environment Variables."
      });
    }

    const { image, duration, motionType, prompt } = req.body;

    if (!image) {
      return res.status(400).json({
        error: "No image provided."
      });
    }

    const finalPrompt = buildPrompt(motionType, prompt);

    const output = await replicate.run("kwaivgi/kling-v1.6-pro", {
      input: {
        prompt: finalPrompt,
        start_image: image,
        duration: duration === "10" ? 10 : 5,
        cfg_scale: 0.5
      }
    });

    const videoUrl = Array.isArray(output) ? output[0] : output;

    return res.status(200).json({
      success: true,
      videoUrl,
      usedPrompt: finalPrompt
    });

  } catch (error) {
    return res.status(500).json({
      error: "Video generation failed.",
      details: error.message
    });
  }
}
