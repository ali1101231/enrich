import { z } from "zod";
import type { Request, Response } from "express";
import { ApiKeyAssignmentService } from "../services/api-key-assignment.service.js";

const manualAssignSchema = z.object({
  userId: z.string().min(1),
  apiKeyId: z.string().min(1),
});

const autoAssignSchema = z.object({
  userId: z.string().min(1),
});

export class AdminAssignmentController {
  constructor(private readonly service = new ApiKeyAssignmentService()) {}

  manualAssign = async (req: Request, res: Response): Promise<void> => {
    const body = manualAssignSchema.parse(req.body);
    await this.service.manualAssignUserToKey(body.userId, body.apiKeyId);
    res.status(204).send();
  };

  autoAssign = async (req: Request, res: Response): Promise<void> => {
    const body = autoAssignSchema.parse(req.body);
    const assignment = await this.service.autoAssignLeastLoadedKey(body.userId);
    res.status(200).json(assignment);
  };

  listAssignments = async (req: Request, res: Response): Promise<void> => {
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const assignments = await this.service.listAssignments(userId);
    res.status(200).json({ items: assignments });
  };

  deactivateAssignment = async (req: Request, res: Response): Promise<void> => {
    const assignmentId = req.params.assignmentId;
    await this.service.deactivateAssignment(assignmentId);
    res.status(204).send();
  };

  deactivateUserAssignments = async (req: Request, res: Response): Promise<void> => {
    const userId = req.params.userId;
    const count = await this.service.deactivateUserAssignments(userId);
    res.status(200).json({ deactivated: count });
  };
}
