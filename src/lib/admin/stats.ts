import { db } from "@/lib/db";
import type { OrderStatus } from "@prisma/client";

export async function getAdminDashboardStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [ordersToday, revenueToday, openTickets, recentOrders] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfDay } } }),
    db.order.aggregate({
      where: {
        createdAt: { gte: startOfDay },
        status: { in: ["PAID", "PROCESSING", "COMPLETED"] },
      },
      _sum: { amountRub: true },
    }),
    db.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        publicId: true,
        email: true,
        type: true,
        status: true,
        amountRub: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    ordersToday,
    revenueToday: Number(revenueToday._sum.amountRub ?? 0),
    openTickets,
    recentOrders,
  };
}

export async function listAdminOrders(opts: {
  status?: OrderStatus;
  q?: string;
  limit?: number;
}) {
  const where = {
    ...(opts.status ? { status: opts.status } : {}),
    ...(opts.q
      ? {
          OR: [
            { publicId: { contains: opts.q, mode: "insensitive" as const } },
            { email: { contains: opts.q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  return db.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 50,
    include: { payment: true },
  });
}
