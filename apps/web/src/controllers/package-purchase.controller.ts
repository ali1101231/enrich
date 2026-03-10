import { z } from "zod";
import type { Request, Response } from "express";
import { PackageService } from "../services/package.service.js";
import { CreditService } from "../services/credit.service.js";

const purchaseSchema = z.object({
  packageId: z.string().min(1),
});

export class PackagePurchaseController {
  constructor(
    private readonly packageService = new PackageService(),
    private readonly creditService = new CreditService(),
  ) {}

  purchase = async (req: Request, res: Response): Promise<void> => {
    const userId = req.authUser?.id;
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { packageId } = purchaseSchema.parse(req.body);

    const pkg = await this.packageService.getById(packageId);
    if (!pkg || !pkg.isActive) {
      res.status(404).json({ error: "Package not found or inactive" });
      return;
    }

    const newBalance = await this.creditService.add(userId, pkg.credits);

    res.status(200).json({
      message: `Successfully added ${pkg.credits} credits from "${pkg.name}" package.`,
      creditsAdded: pkg.credits,
      credits: newBalance,
    });
  };
}
