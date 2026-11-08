const repoUrl = "https://github.com/OSS-Initiatives-IIIT-Sonepat/tiny-aws";

export const site = {
  name: "tiny-aws",
  title: "tiny-aws · A tiny cloud on your own machine",
  description:
    "tiny-aws turns a Linux machine into a small cloud: EC2-like instances, deploys, a load balancer, object storage, and queues. Open source, and small enough to read.",
  tagline: "The minimum amount of code required to turn a Linux machine into a tiny cloud.",
  repo: {
    owner: "OSS-Initiatives-IIIT-Sonepat",
    name: "tiny-aws",
    url: repoUrl,
  },
  docsPath: "/docs",
  install: {
    platform: "Linux",
    lines: [
      `git clone ${repoUrl}.git && cd tiny-aws`,
      "sudo ./scripts/bootstrap-rootfs.sh",
      "./scripts/run-local.sh",
      "cd control-plane/cli && go install .",
    ],
  },
} as const;
