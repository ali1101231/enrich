import { prisma } from "../prisma/client.js";

const DEFAULT_TOOLS: { toolId: string; name: string; description: string }[] = [
  { toolId: "blitz-email-enricher", name: "Email Enricher", description: "Find verified email addresses from LinkedIn profile URLs" },
  { toolId: "blitz-phone-enricher", name: "Phone Finder", description: "Find phone numbers from LinkedIn profile URLs" },
  { toolId: "blitz-company-enricher", name: "Company Enricher", description: "Get detailed company information from LinkedIn company URLs" },
  { toolId: "blitz-domain-to-linkedin", name: "Domain to LinkedIn", description: "Find LinkedIn company page from a domain" },
];

export class ToolService {
  /** Seed default tools if the table is empty. */
  private async seedIfEmpty() {
    const count = await prisma.tool.count();
    if (count > 0) return;
    await prisma.tool.createMany({
      data: DEFAULT_TOOLS.map((t) => ({
        toolId: t.toolId,
        name: t.name,
        description: t.description,
        creditCost: 1,
      })),
      skipDuplicates: true,
    });
  }

  async list() {
    await this.seedIfEmpty();
    return prisma.tool.findMany({ orderBy: { name: "asc" } });
  }

  async getByToolId(toolId: string) {
    return prisma.tool.findUnique({ where: { toolId } });
  }

  async getCreditCost(toolId: string): Promise<number> {
    const tool = await prisma.tool.findUnique({
      where: { toolId },
      select: { creditCost: true },
    });
    return tool?.creditCost ?? 1;
  }

  async create(data: { toolId: string; name: string; description?: string; creditCost?: number }) {
    return prisma.tool.create({
      data: {
        toolId: data.toolId,
        name: data.name,
        description: data.description,
        creditCost: data.creditCost ?? 1,
      },
    });
  }

  async update(id: string, data: { name?: string; description?: string | null; creditCost?: number; isActive?: boolean }) {
    return prisma.tool.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return prisma.tool.delete({ where: { id } });
  }
}
