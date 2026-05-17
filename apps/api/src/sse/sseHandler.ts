import { Request, Response } from "express";
import sseEmitter from "./sseEmitter";

export function sseHandler(req: Request, res: Response) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });

  res.flushHeaders();

  function onEvent(event: string, data: unknown) {
    if (req.connection?.readyState !== "open") {
      sseEmitter.removeListener(event, onEvent);
      return;
    }
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  sseEmitter.on("application:processed", (data) => onEvent("application:processed", data));
  sseEmitter.on("application:failed", (data) => onEvent("application:failed", data));

  req.on("close", () => {
    sseEmitter.removeListener("application:processed", onEvent);
    sseEmitter.removeListener("application:failed", onEvent);
  });
}
