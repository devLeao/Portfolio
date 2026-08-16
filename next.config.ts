import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three e drei publicam ESM moderno; transpilar evita o erro de sintaxe que
  // aparece quando o Next tenta consumir os pacotes crus no server bundle.
  transpilePackages: ["three"],
};

export default nextConfig;
