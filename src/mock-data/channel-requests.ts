/**
 * Channel requests for History's Channel Logs tab and the channel request
 * page (Lightning's `Channels.list_channel_requests` and `ChannelRequestLive`).
 * Static fixtures only.
 */
import type { ChannelRequest } from "./models/channels";


const OPENHIE = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";

const jsonHeaders: [string, string][] = [
  ["content-type", "application/json"],
  ["user-agent", "CommCareHQ"],
  ["authorization", "[REDACTED]"],
  ["x-request-id", "4f1c9a8e-2b6d-4e1f-9c3a-7d5e8b2a1f60"],
];

const patientBody = JSON.stringify(
  { resourceType: "Patient", name: [{ given: ["Aisha"], family: "Okafor" }], gender: "female", birthDate: "2024-11-02" },
  null,
  2
);

export const channelRequests: ChannelRequest[] = [
  {
    id: "4f1c9a8e-2b6d-4e1f-9c3a-7d5e8b2a1f60",
    requestId: "c81d3e5a-77f2-4c0b-a1e9-3b6f0d2c9e14",
    channelId: "5c3e9a1d-7b2f-4e8a-9c6d-1f0e2d3c4b5a",
    projectId: OPENHIE,
    state: "success",
    startedAt: "2026-10-14T09:31:12Z",
    completedAt: "2026-10-14T09:31:12.284Z",
    clientIdentity: "10.0.4.17",
    clientAuthType: "api",
    clientWebhookAuthMethodId: "wam-partner-api",
    destinationCredentialId: "cred-hapi-fhir",
    isWiped: false,
    snapshot: { name: "SHR proxy", destinationUrl: "https://openhim.example.org/fhir", lockVersion: 3 },
    events: [
      {
        type: "destination_response",
        requestMethod: "POST",
        requestPath: "/fhir/Patient",
        requestQueryString: null,
        requestHeaders: jsonHeaders,
        requestBodyPreview: patientBody,
        requestBodySize: 152,
        responseStatus: 201,
        responseHeaders: [
          ["content-type", "application/fhir+json"],
          ["location", "Patient/58213"],
          ["date", "Wed, 14 Oct 2026 09:31:12 GMT"],
        ],
        responseBodyPreview: JSON.stringify({ resourceType: "Patient", id: "58213" }, null, 2),
        responseBodySize: 48,
        latencyUs: 284_000,
        ttfbUs: 251_000,
        queueUs: 1_200,
        connectUs: 38_400,
        requestSendUs: 2_100,
        responseDurationUs: 31_000,
        errorMessage: null,
      },
    ],
  },
  {
    id: "7b3e0d2a-91c4-4f6e-8a5d-2c1b9e7f4a30",
    requestId: "e2a94f17-0c3b-4d8e-b6a1-5f9c2e7d3b08",
    channelId: "5c3e9a1d-7b2f-4e8a-9c6d-1f0e2d3c4b5a",
    projectId: OPENHIE,
    state: "failed",
    startedAt: "2026-10-14T08:02:45Z",
    completedAt: "2026-10-14T08:02:45.131Z",
    clientIdentity: "10.0.4.17",
    clientAuthType: "api",
    clientWebhookAuthMethodId: "wam-partner-api",
    destinationCredentialId: "cred-hapi-fhir",
    isWiped: false,
    snapshot: { name: "Patient proxy", destinationUrl: "https://openhim.example.org/fhir", lockVersion: 2 },
    events: [
      {
        type: "destination_response",
        requestMethod: "GET",
        requestPath: "/fhir/Patient/99999",
        requestQueryString: "_format=json",
        requestHeaders: jsonHeaders.slice(1),
        requestBodyPreview: "",
        requestBodySize: 0,
        responseStatus: 404,
        responseHeaders: [["content-type", "application/fhir+json"]],
        responseBodyPreview: JSON.stringify(
          { resourceType: "OperationOutcome", issue: [{ severity: "error", code: "not-found" }] },
          null,
          2
        ),
        responseBodySize: 96,
        latencyUs: 131_000,
        ttfbUs: 118_500,
        queueUs: null,
        connectUs: null,
        requestSendUs: null,
        responseDurationUs: null,
        errorMessage: null,
      },
    ],
  },
  {
    id: "a90c6e14-3f2b-4d7a-9e81-6b5c0f2d8e47",
    requestId: "5d7f2b90-6e1a-4c3d-8f2b-9a0e4c6b1d73",
    channelId: "b7a6c5d4-3e2f-4a1b-8c9d-0e1f2a3b4c5d",
    projectId: OPENHIE,
    state: "error",
    startedAt: "2026-10-13T16:20:03Z",
    completedAt: "2026-10-13T16:20:08Z",
    clientIdentity: "41.79.12.200",
    clientAuthType: null,
    clientWebhookAuthMethodId: null,
    destinationCredentialId: null,
    isWiped: false,
    snapshot: {
      name: "CommCare forms",
      destinationUrl: "https://commcare.example.org/a/openfn/api/v0.5",
      lockVersion: 1,
    },
    events: [
      {
        type: "error",
        requestMethod: "POST",
        requestPath: "/a/openfn/api/v0.5/form",
        requestQueryString: null,
        requestHeaders: [["content-type", "application/json"]],
        requestBodyPreview: JSON.stringify({ form: { "@name": "Patient registration" } }, null, 2),
        requestBodySize: 52,
        responseStatus: null,
        responseHeaders: null,
        responseBodyPreview: null,
        responseBodySize: null,
        latencyUs: 5_000_000,
        ttfbUs: null,
        queueUs: null,
        connectUs: null,
        requestSendUs: null,
        responseDurationUs: null,
        errorMessage: "econnrefused",
      },
    ],
  },
];

export function channelRequestsIn(projectId: string): ChannelRequest[] {
  return channelRequests.filter((r) => r.projectId === projectId);
}
