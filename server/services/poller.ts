import { getServiceState } from "./remote";
import { getServicesStatus, setServiceState } from "./store";

const interval = Number(process.env.SERVICES_POLL_INTERVAL_MS || 15000);
let timer: NodeJS.Timer | null = null;

export function startServicesPoller() {
  if (timer) return;
  async function tick() {
    try {
      const nginx = await getServiceState("nginx");
      if (nginx !== getServicesStatus().nginx) setServiceState("nginx", nginx);
      const docker = await getServiceState("docker");
      if (docker !== getServicesStatus().docker) setServiceState("docker", docker);
    } catch (e) {
      // swallow errors; keep polling
    }
  }
  tick();
  timer = setInterval(tick, interval);
}
