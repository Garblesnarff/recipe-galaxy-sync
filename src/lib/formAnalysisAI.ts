import { FormAnalysisResult } from "@/types/video";

/**
 * Extract key frames from video at specific timestamps
 */
export const extractKeyFrames = async (
  videoBlob: Blob,
  frameCount: number = 5
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.src = URL.createObjectURL(videoBlob);
    const frames: string[] = [];

    video.onloadedmetadata = async () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const duration = video.duration;
      const interval = duration / (frameCount + 1);

      for (let i = 1; i <= frameCount; i++) {
        const timestamp = interval * i;
        await seekToTime(video, timestamp);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = canvas.toDataURL("image/jpeg", 0.8);
        frames.push(frameData);
      }

      URL.revokeObjectURL(video.src);
      resolve(frames);
    };

    video.onerror = () => reject(new Error("Error loading video"));
  });
};

/**
 * Helper to seek video to specific time
 */
const seekToTime = (video: HTMLVideoElement, time: number): Promise<void> => {
  return new Promise((resolve) => {
    video.currentTime = time;
    video.onseeked = () => resolve();
  });
};

/**
 * Exercise-specific analysis prompts
 */
const getExercisePrompt = (exerciseName: string): string => {
  const exerciseLower = exerciseName.toLowerCase();

  if (exerciseLower.includes("squat")) {
    return `Analyze this squat exercise form. Check for:
    - Depth: Are they reaching at least parallel (thighs parallel to ground)?
    - Knee tracking: Do knees track over toes without caving inward (valgus)?
    - Back position: Is the spine neutral, not rounded?
    - Weight distribution: Is weight balanced over mid-foot?
    - Hip hinge: Proper hip hinge pattern?
    Provide specific feedback on form quality.`;
  }

  if (exerciseLower.includes("deadlift")) {
    return `Analyze this deadlift exercise form. Check for:
    - Back position: Is the spine neutral throughout the movement?
    - Hip hinge: Proper hip hinge with minimal knee bend?
    - Bar path: Does the bar stay close to the body?
    - Lockout: Full hip extension at top?
    - Setup: Proper starting position with shoulders over bar?
    Provide specific feedback on form quality.`;
  }

  if (exerciseLower.includes("bench press") || exerciseLower.includes("push")) {
    return `Analyze this pressing exercise form. Check for:
    - Bar path: Straight vertical path?
    - Elbow position: Proper elbow angle (not too flared)?
    - Shoulder position: Scapulae retracted and stable?
    - Range of motion: Full range with control?
    - Wrist alignment: Neutral wrists?
    Provide specific feedback on form quality.`;
  }

  if (exerciseLower.includes("pull-up") || exerciseLower.includes("pull")) {
    return `Analyze this pulling exercise form. Check for:
    - Range of motion: Full extension at bottom, chin over bar at top?
    - Shoulder engagement: Scapulae properly engaged?
    - Body position: Controlled swing, no kipping (unless intended)?
    - Elbow path: Proper elbow tracking?
    - Core engagement: Stable core throughout?
    Provide specific feedback on form quality.`;
  }

  if (exerciseLower.includes("lunge")) {
    return `Analyze this lunge exercise form. Check for:
    - Knee alignment: Front knee over ankle, not past toes?
    - Back knee: Drops toward ground without hitting?
    - Torso position: Upright torso, not leaning forward?
    - Balance: Stable throughout movement?
    - Hip depth: Sufficient depth in the lunge?
    Provide specific feedback on form quality.`;
  }

  if (exerciseLower.includes("plank")) {
    return `Analyze this plank exercise form. Check for:
    - Body alignment: Straight line from head to heels?
    - Hip position: Not sagging or piked?
    - Shoulder position: Shoulders over elbows?
    - Core engagement: Visible core tension?
    - Head position: Neutral spine, looking down?
    Provide specific feedback on form quality.`;
  }

  // Generic prompt for other exercises
  return `Analyze this ${exerciseName} exercise form. Check for:
  - Proper body alignment and posture
  - Range of motion completion
  - Movement control and stability
  - Common form errors for this exercise
  - Safety considerations
  Provide specific feedback on form quality.`;
};

/**
 * Analyze form using Claude Vision API
 * Note: This requires an API key and backend implementation
 * For now, this is a placeholder that returns mock data
 */
export const analyzeFormWithClaudeVision = async (
  frames: string[],
  exerciseName: string
): Promise<FormAnalysisResult> => {
  // In production, this would call your backend API which then calls Claude
  // Backend should handle the API key securely

  // Mock implementation for development
  console.log(`Analyzing ${frames.length} frames for ${exerciseName}`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return mock analysis based on exercise type
  return generateMockAnalysis(exerciseName);
};

/**
 * Generate mock analysis for development
 * This should be replaced with actual AI analysis in production
 */
const generateMockAnalysis = (exerciseName: string): FormAnalysisResult => {
  const exerciseLower = exerciseName.toLowerCase();

  // Different mock data based on exercise type
  if (exerciseLower.includes("squat")) {
    return {
      overallScore: 75,
      feedbackText: "Your squat form shows good depth and knee tracking. However, there's slight forward lean indicating possible ankle mobility limitations. Core engagement is solid throughout the movement.",
      issuesDetected: [
        "Slight forward torso lean",
        "Minimal knee valgus on ascent",
        "Bar path slightly forward"
      ],
      strengths: [
        "Good depth - breaking parallel consistently",
        "Strong core engagement",
        "Controlled tempo on descent"
      ],
      improvementSuggestions: [
        "Work on ankle mobility with calf stretches",
        "Focus on keeping chest up throughout the movement",
        "Add pause squats to improve bottom position strength",
        "Consider using a wider stance to reduce forward lean"
      ]
    };
  }

  if (exerciseLower.includes("deadlift")) {
    return {
      overallScore: 82,
      feedbackText: "Strong deadlift form with excellent hip hinge pattern. Back remains neutral throughout the lift. Minor issue with bar drifting away from body mid-pull.",
      issuesDetected: [
        "Bar drifts slightly away from shins during pull",
        "Lockout could be more complete"
      ],
      strengths: [
        "Excellent neutral spine position",
        "Strong hip hinge pattern",
        "Good starting position",
        "Controlled descent"
      ],
      improvementSuggestions: [
        "Keep bar closer to body by engaging lats more",
        "Ensure full hip extension at lockout",
        "Practice deficit deadlifts for position reinforcement"
      ]
    };
  }

  if (exerciseLower.includes("push-up") || exerciseLower.includes("bench")) {
    return {
      overallScore: 70,
      feedbackText: "Decent pressing form with good range of motion. Elbows are slightly too flared, which can stress shoulders. Core engagement needs improvement to prevent lower back arch.",
      issuesDetected: [
        "Elbows flared beyond 45 degrees",
        "Lower back arching",
        "Inconsistent rep tempo"
      ],
      strengths: [
        "Full range of motion",
        "Consistent depth on each rep",
        "Good scapular control"
      ],
      improvementSuggestions: [
        "Keep elbows closer to body (30-45 degree angle)",
        "Engage core throughout to maintain neutral spine",
        "Practice slow eccentric (3-second descent)",
        "Consider incline variation to build strength"
      ]
    };
  }

  // Generic analysis
  return {
    overallScore: 78,
    feedbackText: `Your ${exerciseName} form demonstrates good overall technique with room for refinement. Movement is controlled with adequate range of motion.`,
    issuesDetected: [
      "Minor form breakdown toward end of set",
      "Slight compensation pattern visible"
    ],
    strengths: [
      "Good movement control",
      "Adequate range of motion",
      "Consistent tempo"
    ],
    improvementSuggestions: [
      "Focus on maintaining form as fatigue sets in",
      "Consider reducing weight to perfect technique",
      "Practice the movement with tempo variations",
      "Record yourself regularly to monitor progress"
    ]
  };
};

/**
 * Parse AI response into structured format
 * This would be used when implementing actual AI integration
 */
export const parseAIResponse = (aiResponse: string): FormAnalysisResult => {
  // This is a placeholder for when you implement actual AI integration
  // You would parse the Claude API response here

  try {
    // Attempt to extract structured data from AI response
    // This is a simplified example
    const scoreMatch = aiResponse.match(/score[:\s]+(\d+)/i);
    const overallScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;

    return {
      overallScore,
      feedbackText: aiResponse,
      issuesDetected: [],
      strengths: [],
      improvementSuggestions: []
    };
  } catch (error) {
    console.error("Error parsing AI response:", error);
    throw new Error("Failed to parse AI analysis");
  }
};

/**
 * Main function to analyze video form
 */
export const analyzeVideoForm = async (
  videoBlob: Blob,
  exerciseName: string
): Promise<FormAnalysisResult> => {
  try {
    // Extract key frames from video
    const frames = await extractKeyFrames(videoBlob, 5);

    // Analyze with AI (currently returns mock data)
    const analysis = await analyzeFormWithClaudeVision(frames, exerciseName);

    return analysis;
  } catch (error) {
    console.error("Error analyzing video form:", error);
    throw error;
  }
};
