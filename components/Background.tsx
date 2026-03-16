"use client";

import { useGlobalSettings } from "@/lib/settings";
import { FlowBackground } from "./FlowBackground";
import { PS3Background } from "./PS3Background";

export function Background() {
  const { global } = useGlobalSettings();
  if (global.bgStyle === "ps3")   return <PS3Background />;
  if (global.bgStyle === "night") return null;
  return <FlowBackground />;
}
