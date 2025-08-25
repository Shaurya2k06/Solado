/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solado.json`.
 */
export type Solado = {
  "address": "8SsWF8CPzvbepfQqkrGfafgtEG1ZZWx6xRtJXW5vMCDH",
  "metadata": {
    "name": "solado",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createCampaign",
      "discriminator": [
        111,
        131,
        187,
        98,
        160,
        193,
        114,
        244
      ],
      "accounts": [
        {
          "name": "campaign",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  97,
                  109,
                  112,
                  97,
                  105,
                  103,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "creator"
              },
              {
                "kind": "arg",
                "path": "title"
              }
            ]
          }
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "title",
          "type": "string"
        },
        {
          "name": "description",
          "type": "string"
        },
        {
          "name": "goalAmount",
          "type": "u64"
        },
        {
          "name": "deadline",
          "type": "i64"
        },
        {
          "name": "metadataUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "deleteCampaign",
      "discriminator": [
        223,
        105,
        48,
        131,
        88,
        27,
        249,
        227
      ],
      "accounts": [
        {
          "name": "campaign",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true,
          "relations": [
            "campaign"
          ]
        }
      ],
      "args": []
    },
    {
      "name": "donate",
      "discriminator": [
        121,
        186,
        218,
        211,
        73,
        70,
        196,
        180
      ],
      "accounts": [
        {
          "name": "campaign",
          "writable": true
        },
        {
          "name": "donor",
          "writable": true,
          "signer": true
        },
        {
          "name": "donationRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  110,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "campaign"
              },
              {
                "kind": "account",
                "path": "donor"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "refund",
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "campaign",
          "writable": true
        },
        {
          "name": "donor",
          "writable": true,
          "signer": true
        },
        {
          "name": "donationRecord",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  100,
                  111,
                  110,
                  97,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "campaign"
              },
              {
                "kind": "account",
                "path": "donor"
              }
            ]
          }
        }
      ],
      "args": []
    },
    {
      "name": "withdraw",
      "discriminator": [
        183,
        18,
        70,
        156,
        148,
        109,
        161,
        34
      ],
      "accounts": [
        {
          "name": "campaign",
          "writable": true
        },
        {
          "name": "creator",
          "writable": true,
          "signer": true,
          "relations": [
            "campaign"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "campaign",
      "discriminator": [
        50,
        40,
        49,
        11,
        157,
        220,
        229,
        192
      ]
    },
    {
      "name": "donationRecord",
      "discriminator": [
        219,
        64,
        180,
        111,
        72,
        70,
        71,
        0
      ]
    }
  ],
  "events": [
    {
      "name": "campaignCreated",
      "discriminator": [
        9,
        98,
        69,
        61,
        53,
        131,
        64,
        152
      ]
    },
    {
      "name": "campaignDeleted",
      "discriminator": [
        93,
        211,
        150,
        140,
        37,
        45,
        170,
        238
      ]
    },
    {
      "name": "donationMade",
      "discriminator": [
        181,
        70,
        105,
        197,
        198,
        205,
        198,
        197
      ]
    },
    {
      "name": "fundsWithdrawn",
      "discriminator": [
        56,
        130,
        230,
        154,
        35,
        92,
        11,
        118
      ]
    },
    {
      "name": "refundIssued",
      "discriminator": [
        249,
        16,
        159,
        159,
        93,
        186,
        145,
        206
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidGoalAmount",
      "msg": "Invalid goal amount"
    },
    {
      "code": 6001,
      "name": "invalidDeadline",
      "msg": "Invalid deadline"
    },
    {
      "code": 6002,
      "name": "titleTooLong",
      "msg": "Title too long"
    },
    {
      "code": 6003,
      "name": "descriptionTooLong",
      "msg": "Description too long"
    },
    {
      "code": 6004,
      "name": "uriTooLong",
      "msg": "URI too long"
    },
    {
      "code": 6005,
      "name": "invalidDonationAmount",
      "msg": "Invalid donation amount"
    },
    {
      "code": 6006,
      "name": "campaignNotActive",
      "msg": "Campaign not active"
    },
    {
      "code": 6007,
      "name": "campaignExpired",
      "msg": "Campaign expired"
    },
    {
      "code": 6008,
      "name": "unauthorized",
      "msg": "unauthorized"
    },
    {
      "code": 6009,
      "name": "campaignNotExpired",
      "msg": "Campaign not expired"
    },
    {
      "code": 6010,
      "name": "goalNotReached",
      "msg": "Goal not reached"
    },
    {
      "code": 6011,
      "name": "goalReached",
      "msg": "Goal already reached"
    },
    {
      "code": 6012,
      "name": "invalidCampaign",
      "msg": "Invalid campaign"
    },
    {
      "code": 6013,
      "name": "insufficientFunds",
      "msg": "Insufficient funds"
    },
    {
      "code": 6014,
      "name": "overflow",
      "msg": "Arithmetic overflow"
    },
    {
      "code": 6015,
      "name": "underflow",
      "msg": "Arithmetic underflow"
    },
    {
      "code": 6016,
      "name": "campaignHasDonations",
      "msg": "Campaign has donations and cannot be deleted"
    }
  ],
  "types": [
    {
      "name": "campaign",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "goalAmount",
            "type": "u64"
          },
          {
            "name": "donatedAmount",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          },
          {
            "name": "metadataUri",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "isActive",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "campaignCreated",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "campaign",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "goalAmount",
            "type": "u64"
          },
          {
            "name": "deadline",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "campaignDeleted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "campaign",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          }
        ]
      }
    },
    {
      "name": "donationMade",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "campaign",
            "type": "pubkey"
          },
          {
            "name": "donor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "totalDonated",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "donationRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "donor",
            "type": "pubkey"
          },
          {
            "name": "campaign",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "fundsWithdrawn",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "campaign",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "refundIssued",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "campaign",
            "type": "pubkey"
          },
          {
            "name": "donor",
            "type": "pubkey"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
