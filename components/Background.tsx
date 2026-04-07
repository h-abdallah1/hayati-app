"use client";

import { useGlobalSettings } from "@/lib/settings";
import { FlowBackground } from "./FlowBackground";
import { PS3Background } from "./PS3Background";
import { StarfieldBackground } from "./StarfieldBackground";
import { RainBackground } from "./RainBackground";
import { MatrixBackground } from "./MatrixBackground";
import { FirefliesBackground } from "./FirefliesBackground";
import { ParticleNetworkBackground } from "./ParticleNetworkBackground";
import { GradientBackground } from "./GradientBackground";

export function Background() {
  const { global } = useGlobalSettings();
  if (global.bgStyle === "ps3")       return <PS3Background />;
  if (global.bgStyle === "stars")     return <StarfieldBackground />;
  if (global.bgStyle === "night")     return null;
  if (global.bgStyle === "rain")      return <RainBackground />;
  if (global.bgStyle === "matrix")    return <MatrixBackground />;
  if (global.bgStyle === "fireflies") return <FirefliesBackground />;
  if (global.bgStyle === "particles") return <ParticleNetworkBackground />;
  if (global.bgStyle === "gradient")  return <GradientBackground />;
  return <FlowBackground />;
}
