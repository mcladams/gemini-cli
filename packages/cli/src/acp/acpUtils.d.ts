/**
 * @license
 * Copyright 2026 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
import {
  type Config,
  type ToolResult,
  type ToolCallConfirmationDetails,
  Kind,
} from '@google/gemini-cli-core';
import type * as acp from '@agentclientprotocol/sdk';
import { z } from 'zod';
import type { LoadedSettings } from '../config/settings.js';
export declare function hasMeta(obj: unknown): obj is {
  _meta?: Record<string, unknown>;
};
export declare const RequestPermissionResponseSchema: z.ZodObject<
  {
    outcome: z.ZodDiscriminatedUnion<
      'outcome',
      [
        z.ZodObject<
          {
            outcome: z.ZodLiteral<'cancelled'>;
          },
          'strip',
          z.ZodTypeAny,
          {
            outcome: 'cancelled';
          },
          {
            outcome: 'cancelled';
          }
        >,
        z.ZodObject<
          {
            outcome: z.ZodLiteral<'selected'>;
            optionId: z.ZodString;
          },
          'strip',
          z.ZodTypeAny,
          {
            outcome: 'selected';
            optionId: string;
          },
          {
            outcome: 'selected';
            optionId: string;
          }
        >,
      ]
    >;
  },
  'strip',
  z.ZodTypeAny,
  {
    outcome:
      | {
          outcome: 'cancelled';
        }
      | {
          outcome: 'selected';
          optionId: string;
        };
  },
  {
    outcome:
      | {
          outcome: 'cancelled';
        }
      | {
          outcome: 'selected';
          optionId: string;
        };
  }
>;
export declare function toToolCallContent(
  toolResult: ToolResult,
): acp.ToolCallContent | null;
export declare function toPermissionOptions(
  confirmation: ToolCallConfirmationDetails,
  config: Config,
  enablePermanentToolApproval?: boolean,
): acp.PermissionOption[];
export declare function toAcpToolKind(kind: Kind): acp.ToolKind;
export declare function buildAvailableModes(
  isPlanEnabled: boolean,
): acp.SessionMode[];
export declare function buildAvailableModels(
  config: Config,
  settings: LoadedSettings,
): {
  availableModels: Array<{
    modelId: string;
    name: string;
    description?: string;
  }>;
  currentModelId: string;
};
