import express, { Request, Response } from "express";
import { Queue, Worker, Job } from "bullmq";
import { createServer } from "http";
import dotenv from "dotenv";
import cors from "cors";
import { randomUUID } from "crypto";
dotenv.config();

interface Order {
  jobId: string;
  status: string;
  result: any;
}
const database: Record<string, Order> = {};

const app = express();
app.use(cors());
const server = createServer(app);

app.use(express.json());

const redisConfig = { connection: { host: "localhost", port: 6379 } };
const queue = new Queue("orderQueue", redisConfig);

app.post("/order", async (req: Request, res: Response) => {
  const order = req.body;
  const jobId = randomUUID();

  await queue.add("processOrder", order, { jobId });

  database[jobId] = { jobId, status: "Processing", result: null };

  res.status(202).json({ success: true, jobId });
});

app.get("/order/:jobId", async (req: Request, res: Response): Promise<any> => {
  const { jobId } = req.params;

  const order = database[jobId];
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }

  res.json(order);
});

const worker = new Worker(
  "orderQueue",
  async (job: Job) => {
    await new Promise((resolve) => setTimeout(resolve, 5000));

    const result = { ...job.data, status: "Order processed successfully" };

    const order = database[job.id!];
    if (order) {
      order.status = "Processed";
      order.result = result;
    }

    return result;
  },
  redisConfig
);

const port = process.env.PORT || 3001;
server.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
