import { z } from "zod";
import type { Request, Response } from "express";
import { GuideService, GuideServiceError } from "../services/guide.service.js";

const createSchema = z.object({
  title: z.string().min(1).max(160),
  content: z.string().min(1).max(50000),
  videoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(160).optional(),
  content: z.string().min(1).max(50000).optional(),
  videoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

const allowedVideoHosts = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

function assertYouTubeUrl(videoUrl: string | null | undefined): void {
  if (!videoUrl) return;

  const host = new URL(videoUrl).hostname.toLowerCase();
  if (!allowedVideoHosts.has(host)) {
    throw new GuideServiceError("Only YouTube video URLs are allowed", 400);
  }
}

function handleGuideError(error: unknown, res: Response): boolean {
  if (error instanceof GuideServiceError) {
    res.status(error.status).json({ error: error.message });
    return true;
  }
  return false;
}

export class AdminGuideController {
  constructor(private readonly service = new GuideService()) {}

  list = async (_req: Request, res: Response): Promise<void> => {
    const items = await this.service.listAdmin();
    res.status(200).json({ items });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = createSchema.parse(req.body);

    try {
      assertYouTubeUrl(body.videoUrl);

      const item = await this.service.create({
        title: body.title.trim(),
        content: body.content.trim(),
        videoUrl: body.videoUrl,
        isActive: body.isActive,
        createdById: req.authUser?.id,
      });
      res.status(201).json(item);
    } catch (error) {
      if (!handleGuideError(error, res)) {
        throw error;
      }
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const body = updateSchema.parse(req.body);

    try {
      assertYouTubeUrl(body.videoUrl);

      const item = await this.service.update(req.params.guideId, {
        title: body.title?.trim(),
        content: body.content?.trim(),
        videoUrl: body.videoUrl,
        isActive: body.isActive,
      });
      res.status(200).json(item);
    } catch (error) {
      if (!handleGuideError(error, res)) {
        throw error;
      }
    }
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.service.remove(req.params.guideId);
      res.status(204).send();
    } catch (error) {
      if (!handleGuideError(error, res)) {
        throw error;
      }
    }
  };
}
