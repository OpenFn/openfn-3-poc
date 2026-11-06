/**
 * Channels (Lightning's experimental HTTP proxy): a channel forwards requests
 * made to its proxy URL on to a destination service. Static fixtures for the
 * channels index (`Channels.list_channels_for_project_with_stats/1`).
 */

import { credentials } from "./credentials";
import { webhookAuthMethodsIn } from "./project-settings";
import type { Channel } from "./models/channels";
import type { ChannelRow } from "@/types/channels";
import { channelProxyUrl } from "@/utils/urls";

const OPENHIE = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";

export const channels: Channel[] = [
  {
    id: "5c3e9a1d-7b2f-4e8a-9c6d-1f0e2d3c4b5a",
    projectId: OPENHIE,
    name: "SHR proxy",
    enabled: true,
    destinationUrl: "https://openhim.example.org/fhir",
    destinationCredentialId: "cred-hapi-fhir",
    clientAuthMethodIds: ["wam-partner-api"],
    requestCount: 3421,
    lastActivityAt: "2026-10-14T08:55:00Z",
    lockVersion: 3,
  },
  {
    id: "b7a6c5d4-3e2f-4a1b-8c9d-0e1f2a3b4c5d",
    projectId: OPENHIE,
    name: "CommCare forms",
    enabled: true,
    destinationUrl: "https://commcare.example.org/a/openfn/api/v0.5",
    destinationCredentialId: null,
    clientAuthMethodIds: [],
    requestCount: 112,
    lastActivityAt: "2026-10-13T16:20:00Z",
    lockVersion: 1,
  },
  {
    id: "9e8d7c6b-5a4f-4e3d-8c2b-1a0f9e8d7c6b",
    projectId: OPENHIE,
    name: "DHIS2 tracker",
    enabled: false,
    destinationUrl: "https://play.dhis2.org/api",
    destinationCredentialId: null,
    clientAuthMethodIds: [],
    requestCount: 0,
    lastActivityAt: null,
    lockVersion: 1,
  },
];

export function channelsIn(projectId: string): Channel[] {
  return channels.filter((c) => c.projectId === projectId);
}

export function findChannel(id: string | undefined): Channel | undefined {
  return channels.find((c) => c.id === id);
}

/** A project's channels as the Channels list shows them, for stories. */
export function channelRowsFor(projectId: string): ChannelRow[] {
  return channelsIn(projectId).map((c) => ({ ...c, proxyUrl: channelProxyUrl(c.id) }));
}

/** The OpenHIE project's webhook auth methods (Client credentials), as [name, id], for stories. */
export const webhookAuthMethodOptions = webhookAuthMethodsIn(OPENHIE).map(({ id, name }): [string, string] => [name, id]);

/** The OpenHIE project's credentials (Destination credential), as [name, id], for stories. */
export const projectCredentialOptions = credentials.filter((c) => c.projectIds.includes(OPENHIE)).map(({ id, name }): [string, string] => [name, id]);
