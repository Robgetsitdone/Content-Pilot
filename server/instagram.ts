import { storage } from "./storage";

interface PublishResult {
  success: boolean;
  postId?: string;
  error?: string;
}

export async function publishToInstagram(
  videoId: number,
  mediaUrl: string,
  caption: string,
  mediaType: "image" | "video"
): Promise<PublishResult> {
  try {
    const settings = await storage.getInstagramSettings();
    
    if (!settings?.accessToken || !settings?.igUserId) {
      return { success: false, error: "Instagram not configured" };
    }

    if (!settings.isConnected) {
      return { success: false, error: "Instagram not connected" };
    }

    const { accessToken, igUserId } = settings;

    if (mediaType === "image") {
      return await publishImage(igUserId, accessToken, mediaUrl, caption);
    } else {
      return await publishVideo(igUserId, accessToken, mediaUrl, caption);
    }
  } catch (error) {
    console.error("Instagram publish error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function publishImage(
  accountId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    const createResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: caption,
          access_token: accessToken,
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error("Instagram create media error:", error);
      return { success: false, error: error.error?.message || "Failed to create media container" };
    }

    const createData = await createResponse.json();
    const containerId = createData.id;

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      console.error("Instagram publish error:", error);
      return { success: false, error: error.error?.message || "Failed to publish media" };
    }

    const publishData = await publishResponse.json();
    return { success: true, postId: publishData.id };
  } catch (error) {
    console.error("Image publish error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function publishVideo(
  accountId: string,
  accessToken: string,
  videoUrl: string,
  caption: string
): Promise<PublishResult> {
  try {
    const createResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl,
          caption: caption,
          media_type: "REELS",
          access_token: accessToken,
        }),
      }
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      console.error("Instagram create video error:", error);
      return { success: false, error: error.error?.message || "Failed to create video container" };
    }

    const createData = await createResponse.json();
    const containerId = createData.id;

    let status = "IN_PROGRESS";
    let attempts = 0;
    const maxAttempts = 30;

    while (status === "IN_PROGRESS" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusResponse = await fetch(
        `https://graph.facebook.com/v18.0/${containerId}?fields=status_code&access_token=${accessToken}`
      );
      
      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        status = statusData.status_code;
      }
      attempts++;
    }

    if (status !== "FINISHED") {
      return { success: false, error: `Video processing failed: ${status}` };
    }

    const publishResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/media_publish`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creation_id: containerId,
          access_token: accessToken,
        }),
      }
    );

    if (!publishResponse.ok) {
      const error = await publishResponse.json();
      console.error("Instagram publish video error:", error);
      return { success: false, error: error.error?.message || "Failed to publish video" };
    }

    const publishData = await publishResponse.json();
    return { success: true, postId: publishData.id };
  } catch (error) {
    console.error("Video publish error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function checkAndPublishScheduledPosts(): Promise<{
  published: number;
  failed: number;
  errors: string[];
}> {
  const result = { published: 0, failed: 0, errors: [] as string[] };
  
  try {
    const settings = await storage.getInstagramSettings();
    
    if (!settings?.autoPublish || !settings?.isConnected) {
      return result;
    }

    const readyPosts = await storage.getScheduledPostsReady();
    
    for (const post of readyPosts) {
      if (!post.mediaUrl || !post.caption) {
        result.errors.push(`Post ${post.id}: Missing media or caption`);
        result.failed++;
        continue;
      }

      const publishResult = await publishToInstagram(
        post.id,
        post.mediaUrl,
        post.caption,
        post.mediaType || "image"
      );

      if (publishResult.success) {
        await storage.updateVideo(post.id, {
          status: "posted",
          publishedDate: new Date(),
          instagramPostId: publishResult.postId,
        });
        result.published++;
      } else {
        result.errors.push(`Post ${post.id}: ${publishResult.error}`);
        result.failed++;
      }
    }
  } catch (error) {
    console.error("Scheduled publish error:", error);
    result.errors.push(error instanceof Error ? error.message : "Unknown error");
  }

  return result;
}
