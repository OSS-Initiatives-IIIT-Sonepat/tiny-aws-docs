import type { Line } from "@/components/landing/ui/command-line";

export type Snippet = {
  value: string;
  label: string;
  copy: string;
  copyLabel: string;
  group: "compute" | "data";
} & ({ kind: "shell"; lines: Line[] } | { kind: "code"; code: string });

const LAUNCH = `tinyaws instance launch --type small
tinyaws instance list`;

const DEPLOY = `tinyaws deploy ./my-app --service --port 3000 --env NODE_ENV=production
curl http://localhost:8088/`;

const STORE = `tinyaws bucket create artifacts
tinyaws object put notes --data hello --bucket artifacts
tinyaws object get notes --bucket artifacts`;

const QUEUE = `tinyaws queue create jobs
tinyaws queue send jobs "build the image"
tinyaws queue receive jobs`;

export const SNIPPETS: Snippet[] = [
  {
    value: "launch",
    group: "compute",
    label: "Launch",
    kind: "shell",
    lines: [
      { kind: "cmd", text: "tinyaws instance launch --type small" },
      { kind: "out", text: "i-1  small  provisioning" },
      { kind: "cmd", text: "tinyaws instance list" },
      { kind: "ok", text: "i-1  small  running" },
    ],
    copy: LAUNCH,
    copyLabel: "Launch commands",
  },
  {
    value: "deploy",
    group: "compute",
    label: "Deploy",
    kind: "shell",
    lines: [
      { kind: "cmd", text: "tinyaws deploy ./my-app --service --port 3000 --env NODE_ENV=production" },
      { kind: "ok", text: "service listening" },
      { kind: "cmd", text: "curl http://localhost:8088/" },
      { kind: "out", text: "200  routed by the load balancer" },
    ],
    copy: DEPLOY,
    copyLabel: "Deploy commands",
  },
  {
    value: "storage",
    group: "data",
    label: "Storage",
    kind: "shell",
    lines: [
      { kind: "cmd", text: "tinyaws bucket create artifacts" },
      { kind: "cmd", text: "tinyaws object put notes --data hello --bucket artifacts" },
      { kind: "ok", text: "stored" },
      { kind: "cmd", text: "tinyaws object get notes --bucket artifacts" },
      { kind: "out", text: "hello" },
    ],
    copy: STORE,
    copyLabel: "Object storage commands",
  },
  {
    value: "queue",
    group: "data",
    label: "Queue",
    kind: "shell",
    lines: [
      { kind: "cmd", text: "tinyaws queue create jobs" },
      { kind: "cmd", text: 'tinyaws queue send jobs "build the image"' },
      { kind: "ok", text: "queued" },
      { kind: "cmd", text: "tinyaws queue receive jobs" },
      { kind: "out", text: "build the image" },
    ],
    copy: QUEUE,
    copyLabel: "Queue commands",
  },
];
