import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
  agentRules: false,
};

initOpenNextCloudflareForDev();

export default nextConfig;
