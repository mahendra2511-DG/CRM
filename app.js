/* ============================================================
   Axon CRM Analytics — Project & Interview Prep
   data + rendering
   Built from a Salesforce CRM export: Account, Lead, Opportunity,
   Opportunity Product, User → Snowflake ELT → Power BI / Tableau.
   ============================================================ */
const KPIS = [
  {
    "name": "Total Leads",
    "desc": "Overall lead volume for the selected period — the base count everything else is measured against.",
    "formula": "COUNT(lead_id)",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Converted Leads",
    "desc": "Leads that actually turned into a customer — the numerator of Lead Conversion Rate.",
    "formula": "COUNT(lead_id) WHERE Is_Converted = 1",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Lead Conversion Rate",
    "desc": "The single most-watched marketing KPI — what share of leads actually become customers, target-tracked vs. the same period last year.",
    "formula": "Converted / Total × 100",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Converted Accounts",
    "desc": "Distinct accounts created via lead conversion — not the same number as Converted Leads, since one account can absorb multiple converted leads.",
    "formula": "COUNT(DISTINCT Converted_Account_ID)",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Converted Opportunities",
    "desc": "Distinct opportunities created via lead conversion — the pipeline handoff from marketing to sales.",
    "formula": "COUNT(DISTINCT Converted_Opportunity_ID)",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Expected Revenue (Converted)",
    "desc": "Pipeline value attributable back to converted leads — joins Lead to Opportunity on Converted_Opportunity_ID.",
    "formula": "SUM(Amount) joined on Converted_Opportunity_ID",
    "table": "fact_lead, fact_opportunity",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Avg Lead Score",
    "desc": "Average Pardot/marketing-automation score across leads that actually have a score — most leads in this dataset have no score at all.",
    "formula": "AVG(Lead_Score) WHERE Lead_Score IS NOT NULL",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Avg Age of Open Leads",
    "desc": "How long leads that haven't converted yet have been sitting untouched — an early-warning signal for a stalling funnel.",
    "formula": "AVG(Age_Days) WHERE Is_Converted = 0",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Total Opportunities",
    "desc": "Overall deal volume for the selected period.",
    "formula": "COUNT(opportunity_id)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Active (Open) Opportunities",
    "desc": "Deals still moving through the funnel — not yet Won or Lost.",
    "formula": "COUNT WHERE Stage_Group NOT IN ('Won','Lost')",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Total Won Revenue",
    "desc": "Booked revenue from closed-won deals — the headline number for a pipeline review.",
    "formula": "SUM(Amount) WHERE Won = 1",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Win Rate",
    "desc": "Win rate measured only on closed deals — the BRD's own acceptance criteria specifically flags getting the denominator wrong here as a common bug (Win+Loss rate can exceed 100% if you divide by all opportunities instead of just closed ones).",
    "formula": "COUNT(Won=1) / COUNT(Won=1 OR Lost=1) × 100",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Loss Rate",
    "desc": "The complement of Win Rate — closed deals only, never includes still-open opportunities.",
    "formula": "COUNT(Won=0, Closed=1) / COUNT(Closed) × 100",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Expected Pipeline Value",
    "desc": "Projected revenue still in play — Amount × Probability, summed across every open deal.",
    "formula": "SUM(Expected_Amount) WHERE Stage_Group NOT IN ('Won','Lost')",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Avg Deal Size (Won)",
    "desc": "Typical rupee/dollar size of a closed-won deal — a benchmark for deal-sizing conversations.",
    "formula": "SUM(Amount WHERE Won=1) / COUNT(Won=1)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Avg Days to Close (Won)",
    "desc": "How long a deal that actually closes takes from creation to close — a sales-cycle-length benchmark.",
    "formula": "AVG(Days_to_Close WHERE Won = 1)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  }
];
const KPI_CATS = ["All", "Lead", "Opportunity"];

/* ---------------- STATS (hero strip) ---------------- */
const STATS = [{"num": "10,000", "lbl": "Leads (Jan 2019–Sep 2020)"}, {"num": "4,646", "lbl": "Opportunities"}, {"num": "3,052", "lbl": "Accounts"}, {"num": "5", "lbl": "Source tables → Snowflake"}, {"num": "16", "lbl": "KPIs across 2 dashboards"}];

/* ---------------- DATA MODEL (Snowflake: Raw → Staging → Mart) ---------------- */
const TABLES = [
  {
    "name": "dim_account",
    "type": "Dimension",
    "rows": "3,052",
    "pk": "account_id",
    "fk": "—"
  },
  {
    "name": "dim_user",
    "type": "Dimension",
    "rows": "98",
    "pk": "user_id",
    "fk": "—"
  },
  {
    "name": "fact_lead",
    "type": "Fact",
    "rows": "10,000",
    "pk": "lead_id",
    "fk": "conv_account_id, conv_opp_id",
    "center": true
  },
  {
    "name": "fact_opportunity",
    "type": "Fact",
    "rows": "4,646",
    "pk": "opportunity_id",
    "fk": "account_id, owner_id"
  },
  {
    "name": "fact_opp_product",
    "type": "Fact",
    "rows": "10,000",
    "pk": "line_item_id",
    "fk": "opportunity_id"
  }
];
const RELATIONSHIPS = ["fact_opportunity → dim_account  (account_id, Many:1)", "fact_opportunity → dim_user  (owner_id, Many:1 — 'who owns this deal')", "fact_opp_product → fact_opportunity  (opportunity_id, Many:1)", "fact_lead → dim_account  (conv_account_id, Many:1 — only populated once a lead converts)", "fact_lead → fact_opportunity  (conv_opp_id, Many:1 — only populated once a lead converts)", "fact_lead → dim_user  (created_by_id, Many:1)", "mart.vw_lead_funnel  — pre-joins fact_lead + dim_account + dim_user for Lead Dashboard", "mart.vw_opp_summary  — pre-joins fact_opportunity + dim_account + dim_user for Opportunity Dashboard"];
const LOAD_ORDER = ["1. raw.account, raw.lead, raw.opportunity, raw.opp_product, raw.user — COPY INTO from CSV, no transformation", "2. stg.dim_account, stg.dim_user — typed, deduplicated dimensions", "3. stg.fact_lead, stg.fact_opportunity — cleaned facts with derived columns (Stage_Group, Deal_Size_Band, Is_Converted, Age_Days)", "4. mart.vw_lead_funnel, mart.vw_opp_summary — SQL views joining staging fact + dims, this is what Power BI/Tableau actually connect to"];
const NULL_NOTES = ["Deleted=TRUE rows are present in every raw table — every staging/mart view must filter WHERE Deleted = 'False' OR Deleted IS NULL, or KPI counts will be inflated by soft-deleted records.", "Opportunity.Amount arrives as text with '$' and commas in the CSV export (e.g. '$54,805.00') — this particular .xlsx already stores it as a clean numeric column, but the raw CSV export used for the actual Snowflake COPY INTO does not; the REPLACE()+CAST() cleanup in the BRD is real and still required in the pipeline.", "Lead.Status (Simplified) is 'Open' for all 10,000 rows in this dataset — a genuine data-quality finding worth flagging rather than treating as a working filter; use the raw Status column (Nurturing / Prospect / Converted / Disqualified / MQL / SQL) instead until Status (Simplified) is fixed upstream.", "Opportunity.Stage has 12 distinct raw values in this dataset (BRD documents up to 15 across the full historical export) — every one must map into Stage_Group (New / Qualified / Late-Stage / Won / Lost) with zero NULLs, or the funnel chart silently drops opportunities.", "Lead.Lead Score is populated for only 603 of 10,000 leads (the rest are blank, not zero) — Avg Lead Score must filter WHERE Lead_Score IS NOT NULL or it understates the average across scored leads.", "Win Rate and Loss Rate must both be scoped to CLOSED deals only (Won=1 OR Lost=1) — dividing by all opportunities instead is the exact bug the BRD's own acceptance criteria (AC-3) calls out, since it lets Win%+Loss% silently exceed 100%."];
const CALC_FIELDS = ["Stage_Group — CASE mapping all 12 raw Stage values to New / Qualified / Late-Stage / Won / Lost", "Deal_Size_Band — Small <$10K / Mid $10K–$50K / Large $50K–$200K / Enterprise >$200K, based on Amount", "Days_to_Close — DATEDIFF(day, Created_Date, Close_Date)", "Quarter_Label — CONCAT('Q', QUARTER(Close_Date), '-', YEAR(Close_Date))", "Is_Converted — CASE WHEN Converted='True' THEN 1 ELSE 0 END (Lead)", "Age_Days — DATEDIFF(day, Created_Date, CURRENT_DATE()) (Lead, open leads only)"];
const JOIN_GUIDE = [["DIM", "dim_account", "account_id", "—", "fact_opportunity, fact_lead (1:Many)", "1 row per account — 3,052 rows"], ["DIM", "dim_user", "user_id", "—", "fact_opportunity (owner_id), fact_lead (created_by_id)", "1 row per sales rep / user — 98 rows"], ["FACT", "fact_lead", "lead_id", "conv_account_id, conv_opp_id", "dim_account, fact_opportunity", "1 row per lead — 10,000 rows"], ["FACT", "fact_opportunity", "opportunity_id", "account_id, owner_id", "dim_account, dim_user", "1 row per deal — 4,646 rows"], ["FACT", "fact_opp_product", "line_item_id", "opportunity_id", "fact_opportunity", "1 row per line item — 10,000 rows"], ["VIEW", "mart.vw_lead_funnel", "—", "—", "fact_lead + dim_account + dim_user, pre-joined", "Source for the Lead Analytics Dashboard"], ["VIEW", "mart.vw_opp_summary", "—", "—", "fact_opportunity + dim_account + dim_user, pre-joined", "Source for the Opportunity Performance Dashboard"]];
const JOIN_PATHS = [["Opportunities by account", "fact_opportunity[account_id] = dim_account[account_id]"], ["Opportunities by owner", "fact_opportunity[owner_id] = dim_user[user_id]"], ["Opportunity line items", "fact_opp_product[opportunity_id] = fact_opportunity[opportunity_id]"], ["Lead conversion → account", "fact_lead[conv_account_id] = dim_account[account_id]"], ["Lead conversion → opportunity", "fact_lead[conv_opp_id] = fact_opportunity[opportunity_id]"], ["Full Lead Dashboard join", "fact_lead ← dim_account, fact_lead ← dim_user (via mart.vw_lead_funnel)"], ["Full Opportunity Dashboard join", "fact_opportunity ← dim_account, fact_opportunity ← dim_user (via mart.vw_opp_summary)"]];
const GLOBAL_FILTERS = [["Date Range (Lead)", "fact_lead.Created_Date"], ["Industry (Lead)", "dim_account.Industry"], ["Lead Source (Lead)", "fact_lead.Lead_Source"], ["Lead Status (Lead)", "fact_lead.Status_Simplified"], ["Region (Lead)", "dim_account.Region"], ["Date Range (Opp)", "fact_opportunity.Created_Date / Close_Date, switchable"], ["Stage / Stage Group (Opp)", "fact_opportunity.Stage_Group"], ["Industry (Opp)", "dim_account.Industry"], ["Owner / Sales Rep (Opp)", "dim_user.Owner_Name"], ["Region (Opp)", "dim_account.Region"], ["Deal Size Band (Opp)", "fact_opportunity.Deal_Size_Band"]];
const DASHBOARDS = [["1", "Lead Analytics Dashboard", "Marketing Team, Sales Management", "Total Leads, Converted Leads, Lead Conversion Rate, Expected Revenue (Converted)", "Line+Area Trend, Donut (Source), Bar (Stage/Status), Bar (Conversion by Source), Bar (Industry), Summary Table"], ["2", "Opportunity Performance Dashboard", "Sales Managers, Sales Directors", "Active Opportunities, Total Won Revenue, Win Rate, Expected Pipeline Value", "Funnel, Multi-Line Trend, Grouped Bar (Win/Lost by Industry), Loss Reason Bar, Expected Pipeline Bar, Top 10 Accounts Table"]];

/* ---------------- DATA DICTIONARY ---------------- */
/* Raw Salesforce exports carry 58-143 columns per table (mostly CRM admin/automation noise). */
/* Only the ~15-20 columns actually used by the KPIs and mart views are documented here. */
const DATA_DICTIONARY = [
  {
    "table": "Account (raw: 58 columns)",
    "rows": "3,052 rows",
    "cols": [
      [
        "Account ID",
        "String",
        "Unique account identifier (PK)",
        "18-character Salesforce ID"
      ],
      [
        "Account Name",
        "String",
        "Account/company name",
        "—"
      ],
      [
        "Account Type",
        "String",
        "Customer / Prospect / Partner / etc.",
        "—"
      ],
      [
        "Industry",
        "String",
        "Primary industry classification",
        "Duplicate 'Industry(2)' column exists in raw export — coalesce into one Industry column"
      ],
      [
        "Billing City / Billing State/Province / Billing Country",
        "String",
        "Address fields",
        "Used to derive Region"
      ],
      [
        "Account Rating",
        "String",
        "Hot / Warm / Cold",
        "—"
      ],
      [
        "Annual Revenue",
        "Decimal",
        "Reported annual revenue",
        "—"
      ],
      [
        "Created By ID",
        "String",
        "FK → dim_user",
        "—"
      ],
      [
        "Created Date",
        "Date",
        "Account creation date",
        "—"
      ],
      [
        "Deleted",
        "Boolean/String",
        "Soft-delete flag",
        "Must filter Deleted='False' in every staging/mart query"
      ]
    ]
  },
  {
    "table": "User (raw: 143 columns)",
    "rows": "98 rows",
    "cols": [
      [
        "User ID",
        "String",
        "Unique user identifier (PK)",
        "Only ~15-20 of 143 raw columns are actually CRM-relevant — the rest are Salesforce UI/notification preference settings"
      ],
      [
        "Full Name",
        "String",
        "Sales rep or admin's name",
        "Derived from First/Last Name in the raw export"
      ],
      [
        "Active",
        "Boolean",
        "Whether the user account is active",
        "Filter to Active=TRUE for 'current sales reps' views"
      ],
      [
        "City / Country",
        "String",
        "User location",
        "—"
      ],
      [
        "Created By ID",
        "String",
        "Who created this user record",
        "—"
      ],
      [
        "Created Date",
        "Date",
        "User record creation date",
        "—"
      ],
      [
        "Department / Role",
        "String",
        "Org role, where populated",
        "Sparse in this dataset — many blanks"
      ],
      [
        "Delegated Approver ID",
        "String",
        "Approval-chain reference",
        "Not used in dashboard KPIs"
      ]
    ]
  },
  {
    "table": "Lead (raw: 93 columns)",
    "rows": "10,000 rows",
    "cols": [
      [
        "Lead ID",
        "String",
        "Unique lead identifier (PK)",
        "—"
      ],
      [
        "Lead Source",
        "String",
        "Where the lead originated",
        "27 distinct raw values — Inside Sales and Website dominate; several near-duplicate values (e.g. 'Advertisement' / 'Advertisment' / 'Advertising') need coalescing"
      ],
      [
        "Status",
        "String",
        "Nurturing / Prospect / Converted / Disqualified / MQL / SQL / Qualified / Untouched",
        "Use this, not Status (Simplified)"
      ],
      [
        "Status (Simplified)",
        "String",
        "Intended simplified status",
        "Every one of the 10,000 rows is 'Open' in this dataset — a genuine data-quality finding, not a usable filter as-is"
      ],
      [
        "Industry",
        "String",
        "Account industry at time of lead capture",
        "Safety and Security and Life Sciences dominate this dataset"
      ],
      [
        "Converted",
        "Boolean/String",
        "Whether the lead converted",
        "Arrives as text 'True'/'False' — cast to BIT via Is_Converted"
      ],
      [
        "Converted Account ID",
        "String",
        "FK → dim_account",
        "Only populated when Converted = True"
      ],
      [
        "Converted Opportunity ID",
        "String",
        "FK → fact_opportunity",
        "Only populated when Converted = True"
      ],
      [
        "Lead Score",
        "Decimal",
        "Marketing-automation lead score",
        "Populated for only 603 of 10,000 rows — filter IS NOT NULL before averaging"
      ],
      [
        "Pardot Grade",
        "String",
        "Marketing-automation grade",
        "Mixed types (text + NULL) in raw export — coerce to VARCHAR, exclude from numeric aggregations"
      ],
      [
        "Created Date",
        "Date",
        "Lead creation date",
        "—"
      ],
      [
        "Created By ID",
        "String",
        "FK → dim_user",
        "—"
      ]
    ]
  },
  {
    "table": "Opportunity (raw: 88 columns)",
    "rows": "4,646 rows",
    "cols": [
      [
        "Opportunity ID",
        "String",
        "Unique deal identifier (PK)",
        "—"
      ],
      [
        "Account ID",
        "String",
        "FK → dim_account",
        "—"
      ],
      [
        "Owner ID",
        "String",
        "FK → dim_user — the sales rep who owns this deal",
        "—"
      ],
      [
        "Stage",
        "String",
        "Raw Salesforce pipeline stage",
        "12 distinct raw values in this dataset — must map to Stage_Group"
      ],
      [
        "Amount",
        "Decimal",
        "Deal value",
        "Arrives as '$54,805.00'-style text in the raw CSV export; already numeric in this .xlsx"
      ],
      [
        "Expected Amount",
        "Decimal",
        "Amount × Probability — projected revenue",
        "Feeds Expected Pipeline Value"
      ],
      [
        "Probability (%)",
        "Decimal",
        "Stage-based win probability",
        "—"
      ],
      [
        "Won",
        "Boolean/String",
        "Whether the deal closed won",
        "Arrives as text 'True'/'False' — cast to BIT"
      ],
      [
        "Closed",
        "Boolean/String",
        "Whether the deal is closed (won or lost)",
        "Won=False AND Closed=True means Lost"
      ],
      [
        "Closed Lost Reason",
        "String",
        "Free-text loss reason",
        "'Non Responsive' and 'Duplicate opportunity' are the top two reasons in this dataset"
      ],
      [
        "Created Date / Close Date",
        "Date",
        "Deal lifecycle dates",
        "Mixed M/D/YYYY HH:MM format in raw export — normalize with TO_DATE()"
      ],
      [
        "Deleted",
        "Boolean/String",
        "Soft-delete flag",
        "Must filter Deleted='False'"
      ]
    ]
  },
  {
    "table": "Opportunity Product (raw: 23 columns)",
    "rows": "10,000 rows",
    "cols": [
      [
        "Line Item ID",
        "String",
        "Unique line-item identifier (PK)",
        "—"
      ],
      [
        "Opportunity ID",
        "String",
        "FK → fact_opportunity",
        "—"
      ],
      [
        "Product Name / Product Code / Product ID",
        "String",
        "Product identification",
        "—"
      ],
      [
        "Quantity",
        "Integer",
        "Units on this line",
        "—"
      ],
      [
        "List Price / Sales Price",
        "Decimal",
        "Catalog vs. actual price",
        "—"
      ],
      [
        "Discount",
        "Decimal",
        "Discount % applied to this line",
        "—"
      ],
      [
        "Total Price",
        "Decimal",
        "Line-item total (Sales Price × Quantity)",
        "Used only in the optional product-mix extension to the Opportunity Dashboard"
      ]
    ]
  }
];

/* ---------------- SAMPLE DASHBOARD DATA (real computed values) ---------------- */
const CHART_COLORS = ["#29B5E8", "#1B4F8C", "#DC1F26", "#5B6472", "#7FB6A8", "#F6C445"];
const DASH_MOCKS = [
  {
    "title": "Lead Analytics Dashboard — Funnel Overview",
    "sub": "Computed directly from the Lead workbook — 10,000 leads, Jan 2019–Sep 2020",
    "kpis": [
      {
        "v": "10,000",
        "l": "Total Leads"
      },
      {
        "v": "1,033",
        "l": "Converted Leads"
      },
      {
        "v": "10.3%",
        "l": "Lead Conversion Rate"
      },
      {
        "v": "375",
        "l": "Converted Opportunities"
      }
    ],
    "donuts": [
      {
        "title": "Leads by Source — Top 5",
        "data": [
          [
            "Inside Sales",
            2786
          ],
          [
            "Website",
            2195
          ],
          [
            "Trade Show",
            1610
          ],
          [
            "Webinar",
            1091
          ],
          [
            "Advertisement",
            613
          ]
        ]
      }
    ],
    "bars": [
      {
        "title": "Conversion Rate by Source (%, Top 5)",
        "suffix": "%",
        "data": [
          [
            "Website",
            23.1
          ],
          [
            "Webinar",
            7.4
          ],
          [
            "Trade Show",
            5.8
          ],
          [
            "Advertisement",
            1.5
          ],
          [
            "Inside Sales",
            1.3
          ]
        ]
      }
    ]
  },
  {
    "title": "Lead Analytics Dashboard — Status & Industry",
    "sub": "Computed directly from the dataset — Status and Industry breakdown",
    "kpis": [
      {
        "v": "699",
        "l": "Converted Accounts"
      },
      {
        "v": "1.56 / 100",
        "l": "Avg Lead Score (scored leads)"
      },
      {
        "v": "5,357",
        "l": "Leads — Safety and Security"
      },
      {
        "v": "4,120",
        "l": "Leads — Life Sciences"
      }
    ],
    "donuts": [
      {
        "title": "Lead Status Mix",
        "data": [
          [
            "Nurturing",
            5303
          ],
          [
            "Prospect",
            2154
          ],
          [
            "Converted",
            907
          ],
          [
            "Disqualified",
            690
          ],
          [
            "MQL",
            591
          ],
          [
            "SQL",
            351
          ]
        ]
      }
    ],
    "bars": [
      {
        "title": "Lead Volume by Industry — Top 5",
        "data": [
          [
            "Safety and Security",
            5357
          ],
          [
            "Life Sciences",
            4120
          ],
          [
            "Distributor",
            98
          ],
          [
            "Other",
            83
          ],
          [
            "Biotechnology",
            47
          ]
        ]
      }
    ]
  },
  {
    "title": "Opportunity Performance — Pipeline Overview",
    "sub": "Computed directly from the Opportunity workbook — 4,646 deals",
    "kpis": [
      {
        "v": "1,272",
        "l": "Active (Open) Opportunities"
      },
      {
        "v": "$136.26M",
        "l": "Total Won Revenue"
      },
      {
        "v": "42.8%",
        "l": "Win Rate"
      },
      {
        "v": "$47.88M",
        "l": "Expected Pipeline Value"
      }
    ],
    "donuts": [
      {
        "title": "Pipeline Stage Mix",
        "data": [
          [
            "Closed Lost",
            1931
          ],
          [
            "Closed Won",
            1443
          ],
          [
            "Qualified Opportunity",
            439
          ],
          [
            "Funnel",
            424
          ],
          [
            "Cust. Assessment",
            141
          ],
          [
            "Quoted Funnel",
            117
          ]
        ]
      }
    ],
    "bars": [
      {
        "title": "Top 5 Loss Reasons",
        "data": [
          [
            "Non Responsive",
            476
          ],
          [
            "Duplicate opportunity",
            419
          ],
          [
            "Other",
            315
          ],
          [
            "Lost or No Budget",
            236
          ],
          [
            "Contact has moved",
            119
          ]
        ]
      }
    ]
  },
  {
    "title": "Opportunity Performance — Win/Loss & Accounts",
    "sub": "Computed directly from the dataset — win/loss by industry and top accounts",
    "kpis": [
      {
        "v": "$95,354",
        "l": "Avg Deal Size (Won)"
      },
      {
        "v": "99.4 days",
        "l": "Avg Days to Close (Won)"
      },
      {
        "v": "57.2%",
        "l": "Loss Rate"
      },
      {
        "v": "12",
        "l": "Distinct raw Stage values"
      }
    ],
    "donuts": [
      {
        "title": "Won vs Lost — Top 5 Industries",
        "data": [
          [
            "Biopharma/Pharma — Won",
            471
          ],
          [
            "State and Local — Won",
            245
          ],
          [
            "International — Won",
            114
          ],
          [
            "Federal — Won",
            95
          ],
          [
            "Academia — Won",
            71
          ]
        ]
      }
    ],
    "bars": [
      {
        "title": "Top 5 Accounts by Won Revenue",
        "prefix": "$",
        "data": [
          [
            "Federal Resources",
            31516377
          ],
          [
            "PM Countermine & EOD",
            26606760
          ],
          [
            "U.S. Customs & Border Protection",
            10407277
          ],
          [
            "Congue A Institute",
            4510335
          ],
          [
            "908",
            2426046
          ]
        ]
      }
    ]
  }
];

/* ---------------- SQL & QA LAB (Snowflake syntax) ---------------- */
const SQL_BLOCKS = [
  {
    "title": "1 · Data Count Validation",
    "desc": "Confirm record counts match between raw, staging (post soft-delete filter) and the dashboards.",
    "sql": "SELECT COUNT(*) FROM raw.account;      -- expect 3,052\nSELECT COUNT(*) FROM raw.lead;         -- expect 10,000\nSELECT COUNT(*) FROM raw.opportunity;  -- expect 4,646\nSELECT COUNT(*) FROM raw.opp_product;  -- expect 10,000\nSELECT COUNT(*) FROM raw.user;         -- expect 98\nSELECT COUNT(*) FROM stg.dim_account WHERE Deleted = 'False' OR Deleted IS NULL;\nSELECT COUNT(*) FROM stg.fact_opportunity WHERE Deleted = 'False' OR Deleted IS NULL;\n-- stg counts should be <= raw counts (soft-deleted rows filtered out)"
  },
  {
    "title": "2 · Data Completeness Check",
    "desc": "Identify missing or incorrectly-mapped values in key derived columns.",
    "sql": "SELECT * FROM stg.fact_opportunity WHERE Stage_Group IS NULL;\n-- should return 0 rows: every one of the 12 raw Stage values must map to a Stage_Group\nSELECT * FROM stg.fact_lead WHERE Lead_Score IS NOT NULL AND Lead_Score < 0;\n-- sanity check: scores should never be negative\nSELECT * FROM stg.fact_opportunity WHERE Created_Date IS NULL OR Close_Date IS NULL;\n-- flag for exclusion from trend charts per the BRD's null-date handling rule"
  },
  {
    "title": "3 · Data Consistency Check",
    "desc": "Confirm every fact-table row has a valid parent dimension (or converted-lead target) — all three queries should return 0 rows.",
    "sql": "SELECT o.account_id\nFROM stg.fact_opportunity o\nLEFT JOIN stg.dim_account a ON o.account_id = a.account_id\nWHERE a.account_id IS NULL;  -- Should return 0 rows\n\nSELECT o.owner_id\nFROM stg.fact_opportunity o\nLEFT JOIN stg.dim_user u ON o.owner_id = u.user_id\nWHERE u.user_id IS NULL;  -- Should return 0 rows\n\nSELECT l.conv_opp_id\nFROM stg.fact_lead l\nLEFT JOIN stg.fact_opportunity o ON l.conv_opp_id = o.opportunity_id\nWHERE l.Is_Converted = 1 AND o.opportunity_id IS NULL;  -- Should return 0 rows"
  },
  {
    "title": "4 · Duplicate Records Check",
    "desc": "Identify duplicate entries in key tables by primary key.",
    "sql": "SELECT opportunity_id, COUNT(*)\nFROM stg.fact_opportunity\nGROUP BY opportunity_id\nHAVING COUNT(*) > 1;\n\nSELECT lead_id, COUNT(*)\nFROM stg.fact_lead\nGROUP BY lead_id\nHAVING COUNT(*) > 1;\n\nSELECT line_item_id, COUNT(*)\nFROM stg.fact_opp_product\nGROUP BY line_item_id\nHAVING COUNT(*) > 1;"
  },
  {
    "title": "5 · Dashboard Aggregation Check",
    "desc": "Compare SQL output against the equivalent Power BI or Tableau card — the actual values this dataset should produce, including the Win Rate denominator trap called out in the BRD's own acceptance criteria.",
    "sql": "SELECT COUNT(*) FROM stg.fact_lead WHERE Is_Converted = 1;              -- Converted Leads = 1,033\nSELECT COUNT(*)*100.0/(SELECT COUNT(*) FROM stg.fact_lead)\n  FROM stg.fact_lead WHERE Is_Converted = 1;                                -- Lead Conversion Rate ≈ 10.3%\nSELECT SUM(Amount) FROM stg.fact_opportunity WHERE Won = 1;                 -- Total Won Revenue ≈ $136.26M\nSELECT COUNT(*)*100.0 / (\n  SELECT COUNT(*) FROM stg.fact_opportunity WHERE Won = 1 OR Closed_Lost_Reason IS NOT NULL\n) FROM stg.fact_opportunity WHERE Won = 1;                                  -- Win Rate ≈ 42.8% (closed deals only!)\nSELECT SUM(Expected_Amount) FROM stg.fact_opportunity\n  WHERE Stage_Group NOT IN ('Won','Lost');                                  -- Expected Pipeline ≈ $47.88M"
  },
  {
    "title": "6 · Performance Testing",
    "desc": "Check query execution time against the BRD's non-functional requirement: mart view queries under 10 seconds on an X-Small Snowflake warehouse.",
    "sql": "EXPLAIN ANALYZE\nSELECT * FROM stg.fact_opportunity WHERE Created_Date BETWEEN '2020-01-01' AND '2020-09-30';\n-- On an X-Small warehouse this should complete in well under the BRD's 10-second target"
  }
];

/* ---------------- PROBLEM STATEMENT ---------------- */
const PROBLEM_STATEMENT = [
  { icon: "1", ok: false, h: "Siloed Customer Data", p: "Customer and sales data lives disconnected across spreadsheets and manual exports, with no unified view a marketing or sales team can act on." },
  { icon: "2", ok: false, h: "Lack of Real-Time Insights", p: "Lead conversion performance and pipeline health are only visible after manual export and compilation — never current at the moment a decision needs to be made." },
  { icon: "3", ok: false, h: "No KPI-Driven Dashboards", p: "There's no single source of truth for win/loss analysis, lead source performance, or pipeline value — every team reports its own version of the numbers." },
  { icon: "4", ok: false, h: "Poor CRM Reporting Experience", p: "Existing CRM reporting is fragmented and hard to self-serve from, forcing both marketing and sales management back onto manually curated spreadsheet exports for every review." },
];

/* ---------------- TOOLS ---------------- */
const TOOLS = [
  { logo: "assets/excel-logo.jpg", name: "Excel", role: "Phase 1-2 · Profile & prep the data", desc: "Profile the raw Account/Lead/Opportunity/Opp Product/User exports, document data-quality issues, and build a first-pass pivot dashboard — at least 3 KPIs visible, no $ symbols left in Amount — before touching Snowflake." },
  { logo: "assets/mysql-logo.png", name: "Snowflake SQL", role: "Phase 3-4 · Raw → Staging → Mart", desc: "Load the 5 source tables into a Raw schema via COPY INTO, clean and type-cast into a Staging schema (dim_account, dim_user, fact_lead, fact_opportunity), then build the two mart views — vw_lead_funnel and vw_opp_summary — that Power BI and Tableau actually connect to." },
  { logo: "assets/tableau-logo.jpg", name: "Tableau", role: "Phase 5 · Connect to Snowflake, not the file", desc: "Tableau connects live to Snowflake's mart views via JDBC/ODBC — never to the raw CSV/XLSX exports. Builds a Tableau version of both the Lead and Opportunity dashboards, matching Power BI's KPI parity." },
  { logo: "assets/powerbi-logo.png", name: "Power BI", role: "Phase 5 · Connect to Snowflake, not the file", desc: "Same rule as Tableau: Power BI connects to Snowflake's mart views (Import or Live/DirectQuery), models relationships around dim_account and dim_user, and builds DAX measures for all 16 KPIs." },
  { logo: "assets/mysql-logo.png", name: "QA / SQL", role: "Phase 6 · Reconcile SQL to dashboard", desc: "Run SQL directly against the mart views — counts, sums, win/loss rates — and reconcile every number against Power BI and Tableau within the BRD's ±0.1% tolerance before sign-off." },
];

/* ---------------- DOMAIN PRIMER ---------------- */
const DOMAIN_WHAT = "CRM analytics turns the trail every lead, deal and sales activity leaves behind in Salesforce into a measurable picture of the sales and marketing funnel. Instead of marketing tracking lead conversion in disconnected spreadsheets and sales curating manual pipeline exports for every review, one governed Snowflake warehouse and a pair of BI dashboards give both teams a single, reconciled source of truth for where leads come from, how well they convert, and which deals actually close.";

const DOMAIN_WHERE = [
  "B2B sales organizations — pipeline visibility across every deal stage, from first contact to closed won or lost.",
  "Marketing teams — lead source performance and conversion-rate tracking to decide where to spend acquisition budget.",
  "Sales management — win-rate and loss-reason analysis for weekly pipeline reviews and quarterly business reviews.",
  "Revenue operations — a governed ELT pipeline (Raw → Staging → Mart) that keeps Power BI and Tableau in sync from one warehouse instead of two disconnected exports.",
];

const DOMAIN_DATA_TYPES = [
  "Lead records", "Account records", "Opportunity (deal) records", "Opportunity line items / products",
  "User (sales rep) records", "Pipeline stage history", "Win/loss reasons", "Lead source & conversion data",
];

const FLOW = [
  { t: "Data Extraction & Profiling", d: "Profile the 5 raw Salesforce exports (Account, Lead, Opportunity, Opportunity Product, User), document every data-quality issue found in a Data Quality Log." },
  { t: "Data Cleaning & Preparation", d: "Produce clean CSVs and an initial Excel pivot dashboard — strip $ and commas from Amount, normalize dates, filter Deleted=TRUE records." },
  { t: "Snowflake Schema Setup", d: "Load Raw and Staging tables into Snowflake with correct row counts and derived columns (Stage_Group, Deal_Size_Band, Is_Converted, Age_Days)." },
  { t: "Mart Views & Validation", d: "Build vw_lead_funnel and vw_opp_summary, then verify at least 5 KPI values against the Excel baseline within ±1%." },
  { t: "Dashboard Development", d: "Build both dashboards — all 8 KPIs and 6 visuals per dashboard — in Power BI and Tableau, connected live to the Snowflake mart views." },
  { t: "QA & Reconciliation", d: "Complete the QA reconciliation table comparing every SQL KPI value against its dashboard equivalent within ±0.1% tolerance." },
  { t: "Presentation Prep", d: "Assemble the final PPT covering architecture, data model, KPI definitions, wireframes and insights — all 10 required sections." },
];

const TIMELINE = [
  { d: "Week 1", t: "Day 1-5", task: "Data extraction & profiling — Data Quality Log started" },
  { d: "Week 1-2", t: "", task: "Data cleaning & preparation — Excel pivot dashboard produced" },
  { d: "Week 2", t: "", task: "Snowflake Raw + Staging schema setup" },
  { d: "Week 2-3", t: "", task: "Mart views (vw_lead_funnel, vw_opp_summary) & validation" },
  { d: "Week 3-4", t: "", task: "Dashboard development — Power BI + Tableau, both dashboards" },
  { d: "Week 4", t: "", task: "QA & reconciliation — SQL vs dashboard values ±0.1%" },
  { d: "Week 4-5", t: "", task: "Final presentation prep — all 10 required PPT sections" },
];

/* ---------------- RULES & REGULATIONS ---------------- */
const RULES = [
  { icon: "⚠", ok: false, h: "Attendance is mandatory", p: "Missing more than two meetings results in removal from the project. Join every meeting under the same name you registered with — an unrecognized name gets marked absent." },
  { icon: "⚠", ok: false, h: "Attendance alone isn't enough", p: "Sitting in on meetings without actively contributing will also lead to removal. Participation is graded on contribution, not presence." },
  { icon: "✓", ok: true, h: "Flag non-contributing teammates early", p: "If a team member isn't contributing, it's on the group to inform management — by call, WhatsApp, email, or during the weekly review — rather than letting it slide." },
  { icon: "✓", ok: true, h: "Contribute across every tool", p: "You're expected to contribute to Excel, SQL, Tableau, Power BI, and the final PPT. Skipping even one tool entirely puts your place on the project at risk." },
  { icon: "✓", ok: true, h: "Weekly review presentations", p: "Each group presents its progress every week — consistent updates and a prepared walkthrough are expected, not just a working dashboard at the end." },
];

const FOCUS_AREAS = [
  { n: "", h: "Active Contribution", p: "Show up engaged — participate in discussion, don't just observe the build." },
  { n: "", h: "Sharing Insights", p: "Bring your own observations to the team rather than waiting to be assigned tasks." },
  { n: "", h: "Timely Completion", p: "Deliver assigned work inside the agreed deadline, every sprint." },
  { n: "", h: "Collaboration Over Competition", p: "Optimize for the team's dashboard, not for individual credit." },
  { n: "", h: "Clear Communication", p: "Say what you're blocked on before the deadline, not after." },
  { n: "", h: "Active Listening", p: "Actually absorb teammates' updates in review meetings — you'll be asked about their work too." },
  { n: "", h: "Recognizing Contributions", p: "Acknowledge teammates' work — it costs nothing and keeps morale up." },
  { n: "", h: "Daily Team Connectivity", p: "A short daily check-in catches blockers before they become a missed deadline." },
];

/* ---------------- SOCIAL LINKS ---------------- */
const SOCIAL = {
  linkedin: "https://www.linkedin.com/in/mahendra-singh-%F0%9F%87%AE%F0%9F%87%B3%F0%9F%9A%80%E2%9D%84%EF%B8%8F-%F0%9F%90%8D-%F0%9F%A6%84-83699485/",
  medium: "https://medium.com/@mahendraa1188",
  youtube: "https://www.youtube.com/channel/UC2q-vZWSlQpiGiMcSLUqnIg",
};

const CRACKANALYTICS_URL = "https://crackanalytics-mahendra-2026.vercel.app/";

/* ---------------- PROJECT DOCUMENTS ---------------- */
const DOCUMENTS = [
  { name: "CRM Analytics — BRD.docx", desc: "Full Business Requirements Document — architecture, KPIs, data quality rules, acceptance criteria, glossary", icon: "📄", type: "download", href: "assets/docs/CRM_BRD.docx", filename: "CRM_BRD.docx" },
  { name: "Account.xlsx", desc: "Source workbook — 3,052 accounts, 58 raw columns", icon: "📊", type: "download", href: "assets/docs/Account.xlsx", filename: "Account.xlsx" },
  { name: "Lead.xlsx", desc: "Source workbook — 10,000 leads, 93 raw columns", icon: "📊", type: "download", href: "assets/docs/Lead.xlsx", filename: "Lead.xlsx" },
  { name: "Opportunity.xlsx", desc: "Source workbook — 4,646 deals, 88 raw columns", icon: "📊", type: "download", href: "assets/docs/Opportunity.xlsx", filename: "Opportunity.xlsx" },
  { name: "Opportunity_Product.xlsx", desc: "Source workbook — 10,000 line items, 23 raw columns", icon: "📊", type: "download", href: "assets/docs/Opportunity_Product.xlsx", filename: "Opportunity_Product.xlsx" },
  { name: "User_Table.xlsx", desc: "Source workbook — 98 users, 143 raw columns", icon: "📊", type: "download", href: "assets/docs/User_Table.xlsx", filename: "User_Table.xlsx" },
];

/* ---------------- SETUP & SOFTWARE DOWNLOADS ---------------- */
const SOFTWARE_LINKS = [
  { name: "Snowflake trial account", desc: "Free 30-day trial — sign up before Week 1 Day 1, this is the blocking dependency for Phase 3", icon: "❄️", type: "link", href: "https://signup.snowflake.com/" },
  { name: "Tableau Desktop — free download", desc: "Official installer from Tableau (free trial / Public edition)", icon: "📈", type: "link", href: "https://www.tableau.com/products/desktop-free/download" },
  { name: "Power BI Desktop — free download", desc: "Official installer from Microsoft", icon: "⚡", type: "link", href: "https://www.microsoft.com/en-us/download/details.aspx?id=58494" },
];

/* ---------------- INTERVIEW PREP ---------------- */
const QA_CATS = ["Explain This Project", "SQL / Snowflake", "Power BI & DAX", "Tableau", "Data Modeling", "CRM Domain", "General & HR", "Rapid Fire"];

const QA = [
  // ---------------- Explain This Project ----------------
  { cat: "Explain This Project", q: "Explain this project to me — what did you actually build?", a: "Structure it as a story: (1) the data — a Salesforce CRM export covering Jan 2019–Sep 2020, 5 tables (Account, Lead, Opportunity, Opportunity Product, User), ~28,000 total rows; (2) the architecture — Salesforce → CSV/XLSX export → Python/SQL ELT → Snowflake (Raw → Staging → Mart) → Power BI & Tableau via live connection; (3) the challenge you hit and how you solved it; (4) the outcome — a Lead Analytics Dashboard and an Opportunity Performance Dashboard, 16 KPIs total, reconciled to SQL within ±0.1%. Keep it under two minutes.", signal: "Almost always the first question — tests structure and communication before anything technical." },
  { cat: "Explain This Project", q: "Why does this project use an ELT architecture with Snowflake instead of just connecting Power BI straight to the CSV files?", a: "Two reasons: governance and reuse. A single Snowflake warehouse becomes the one source of truth both Power BI and Tableau connect to live, so the two tools can never silently drift apart the way two independently-refreshed spreadsheet exports would. It also lets the messy cleanup — stripping $ from Amount, normalizing dates, filtering soft-deleted rows — happen once in SQL, in a layered Raw → Staging → Mart pipeline, instead of being repeated (and probably done slightly differently) inside each BI tool.", signal: "Tests whether you understand ELT is a governance decision, not just 'because the BRD said so.'" },
  { cat: "Explain This Project", q: "What kind of work did you personally do on this project?", a: "Be specific: which phase you owned (data profiling, Snowflake schema, a specific mart view, a specific dashboard in Power BI or Tableau, or the QA reconciliation), and name actual KPI cards, SQL scripts, or DAX measures that were yours — not a vague 'I worked on the dashboard.'", signal: "Tests whether you can separate your individual contribution from the group's, especially relevant given this project's explicit RACI matrix." },
  { cat: "Explain This Project", q: "What was the business problem this project was solving?", a: "Marketing tracked lead conversion in disconnected spreadsheets, sales pipeline reviews relied on manually curated exports, and there was no single source of truth for win/loss analysis. The two dashboards replace that with a governed warehouse and live-connected BI — one number for 'how many leads converted this month,' agreed by both marketing and sales.", signal: "Tests whether you can state the 'why' behind the project, not just the tool stack." },
  { cat: "Explain This Project", q: "How would you explain the KPI you're most proud of building?", a: "Pick one with a real trap in it — e.g. Win Rate — and walk through the formula, why it must be scoped to closed deals only, and a real insight (in this dataset, Win Rate is 42.8% and Loss Rate 57.2%, with 'Non Responsive' and 'Duplicate opportunity' as the top two loss reasons — a genuine lead-hygiene problem, not a product problem).", signal: "Tests depth over breadth — a common follow-up once the intro answer lands well." },

  // ---------------- SQL / Snowflake ----------------
  { cat: "SQL / Snowflake", q: "Walk me through the COPY INTO statement you'd use to load a raw table in Snowflake.", a: "COPY INTO raw.lead FROM @crm_stage/Lead.csv FILE_FORMAT = (TYPE=CSV SKIP_HEADER=1) — it stages the file first (internal or external stage), then bulk-loads it into the raw landing table with zero transformation. Transformation happens later, in the Staging layer, not during this load.", signal: "Tests a specific Snowflake pattern named directly in this project's BRD." },
  { cat: "SQL / Snowflake", q: "How would you clean the Amount column when moving it from raw to staging?", a: "CREATE OR REPLACE TABLE stg.fact_opportunity AS SELECT ..., REPLACE(REPLACE(amount,'$',''),',','')::DECIMAL(15,2) AS amount ... — strip the dollar sign, strip the thousands-separator commas, then cast to a fixed-precision DECIMAL so downstream SUM() and AVG() work correctly instead of treating Amount as text.", signal: "Tests the exact currency-cleanup pattern this project's data actually requires." },
  { cat: "SQL / Snowflake", q: "Write the mart view that joins fact_opportunity to its dimensions for BI consumption.", a: "CREATE OR REPLACE VIEW mart.vw_opp_summary AS SELECT o.*, a.industry, a.region, u.full_name AS owner_name FROM stg.fact_opportunity o JOIN stg.dim_account a ON o.account_id = a.account_id JOIN stg.dim_user u ON o.owner_id = u.user_id — this is the view Power BI and Tableau actually connect to, not the raw fact table.", signal: "Tests the exact mart-view pattern named in this project's BRD." },
  { cat: "SQL / Snowflake", q: "How would you verify that soft-deleted records are correctly excluded from every mart view?", a: "Compare row counts: SELECT COUNT(*) FROM raw.opportunity vs SELECT COUNT(*) FROM stg.fact_opportunity — staging should be strictly less than or equal to raw, and every staging/mart query must include WHERE Deleted = 'False' OR Deleted IS NULL. If staging count equals raw count, the filter isn't actually being applied.", signal: "Tests translating the BRD's own #2 acceptance criterion into a concrete check." },
  { cat: "SQL / Snowflake", q: "Write a query to correctly calculate Win Rate, avoiding the denominator bug the BRD warns about.", a: "SELECT COUNT(*) WHERE Won=1 / COUNT(*) WHERE (Won=1 OR Closed_Lost_Reason IS NOT NULL) × 100 — the denominator must be closed deals only (won + lost), never all opportunities including open ones. Get this wrong and Win% + Loss% can silently exceed 100%, which is exactly acceptance criterion #3 in this project's BRD.", signal: "Tests whether you actually internalized the specific bug this BRD calls out, not just general SQL syntax." },
  { cat: "SQL / Snowflake", q: "Why does this project's Snowflake warehouse need auto-suspend after 5 minutes of idle time?", a: "Snowflake bills by compute-second while a warehouse is running, and trial accounts have a fixed 30-day credit allotment. Auto-suspend after 5 minutes idle (a named non-functional requirement in this BRD) prevents credits from silently draining overnight or over a weekend when nobody's actively querying.", signal: "Tests understanding of Snowflake's consumption-based billing model, not just SQL syntax." },
  { cat: "SQL / Snowflake", q: "What is Snowflake Time Travel, and how does it help with this project's risk of a trial account expiring?", a: "Time Travel lets you query or restore a table's state as of a past point in time (within a retention window), which is useful for recovering from an accidental bad transform — but it doesn't survive account expiration. The actual mitigation the BRD specifies is exporting all SQL scripts weekly, so the schema and views can be re-executed from scratch on a new account if the 30-day trial lapses.", signal: "Tests whether you can distinguish a genuinely useful Snowflake feature from what actually mitigates this project's specific risk." },

  // ---------------- Power BI & DAX ----------------
  { cat: "Power BI & DAX", q: "How would you connect Power BI to the Snowflake mart views, and which connection mode would you pick?", a: "Use Power BI's native Snowflake connector, point it at mart.vw_lead_funnel and mart.vw_opp_summary, and choose Import for a scheduled-refresh dashboard (no real-time requirement is stated in the BRD) rather than DirectQuery, which would add query latency against Snowflake on every slicer click for no real benefit here.", signal: "Tests connection-mode judgment tied to the BRD's actual stated requirements, not a default answer." },
  { cat: "Power BI & DAX", q: "How would you build the Win Rate measure in DAX so it respects page-level filters correctly?", a: "Win Rate = DIVIDE(CALCULATE(COUNTROWS(fact_opportunity), fact_opportunity[Won]=1), CALCULATE(COUNTROWS(fact_opportunity), fact_opportunity[Won]=1 || fact_opportunity[Closed]=1 && fact_opportunity[Won]=0)) — built with CALCULATE and an explicit closed-deals-only filter, so it recalculates correctly whichever Industry, Owner or Region slicer is applied, and never silently includes open deals in the denominator.", signal: "Tests practical DAX for the project's single most bug-prone KPI." },
  { cat: "Power BI & DAX", q: "Why use DIVIDE() instead of the / operator in DAX measures for this project?", a: "DIVIDE() safely returns BLANK() (or a specified default) on division by zero — important here because Loss Rate and Win Rate both divide by a closed-deal count that could be zero for a heavily-filtered slice (e.g. one owner, one month with no closed deals), which a raw / would throw an error on.", signal: "Tests a DAX best practice with a concrete reason tied to this project's own filterable slicers." },
  { cat: "Power BI & DAX", q: "How would you build the Stage_Group derived field if it wasn't already computed in Snowflake?", a: "Prefer doing it in SQL (in the Staging layer) so both Power BI and Tableau see an identical Stage_Group with zero maintenance duplication — but if it had to be DAX, it'd be a calculated column using a nested SWITCH(TRUE(), Stage IN {...}, \"Won\", Stage IN {...}, \"Lost\", ...) mapping all 12 raw Stage values, since Stage_Group is used for filtering/grouping, not aggregation, so a calculated column (not a measure) is the right call here.", signal: "Tests recognizing when SQL-side transformation is preferable to duplicating logic in DAX, and correctly distinguishes calculated column vs measure for a non-aggregated field." },
  { cat: "Power BI & DAX", q: "How would you build KPI cards that show current period, prior period, and a trend arrow, per the BRD's dashboard design principles?", a: "Three measures: [Current Period Value] filtered to the active date-range slicer, [Prior Period Value] using DATEADD or PARALLELPERIOD to shift the same range back one period, and a conditional-formatting or Unicode-arrow expression comparing the two — IF([Current]>[Prior], \"▲\", \"▼\") — wired into the KPI card visual alongside both raw numbers.", signal: "Tests translating a named dashboard design principle into an actual DAX pattern." },

  // ---------------- Tableau ----------------
  { cat: "Tableau", q: "How would you connect Tableau to Snowflake for this project, matching the BRD's 'live connection' requirement?", a: "Use Tableau's native Snowflake connector, authenticate, and select Live rather than Extract — the BRD explicitly calls for a live JDBC/ODBC connection to the mart views, not a scheduled extract, so both dashboards always reflect the current state of mart.vw_lead_funnel and mart.vw_opp_summary.", signal: "Tests matching the connection type to a requirement stated directly in the BRD, not a default guess." },
  { cat: "Tableau", q: "How would you build the Pipeline Stage Funnel chart correctly ordered from New to Won/Lost?", a: "Use a funnel chart (or a sorted horizontal bar shaped like one) with Stage_Group on rows in an explicit sort order (a calculated field or a manual sort assigning New=1, Qualified=2, Late-Stage=3, Won=4, Lost=5) rather than relying on alphabetical or count-based default sorting, which would scramble the funnel — this is literally acceptance criterion #8 in the BRD.", signal: "Tests translating a named acceptance criterion into an actual build step." },
  { cat: "Tableau", q: "How would you make the global Industry filter cross-filter all 6 visuals on the Opportunity dashboard, per the BRD's design principle?", a: "Add Industry as a filter on one sheet, then use 'Apply to Worksheets → All Using This Data Source' (or explicit Filter Actions targeting every sheet on the dashboard) — the BRD's own acceptance criterion #7 is literally 'select a single industry — all 6 visuals update,' so this needs to be tested manually, not assumed to work by default." },
  { cat: "Tableau", q: "What's the difference between the Win vs Lost by Industry grouped bar and the Loss Reason Analysis bar — aren't they both about losses?", a: "Win vs Lost by Industry answers 'which industries are we winning and losing in' — a market-fit question. Loss Reason Analysis answers 'why do we lose the deals we lose' — an execution/process question (Non Responsive and Duplicate opportunity dominate in this dataset, which points at lead-hygiene and follow-up cadence, not product-market fit). They're deliberately two separate visuals because they drive two different corrective actions.", signal: "Tests whether you understand why the BRD specifies two seemingly-similar loss-analysis visuals instead of one." },
  { cat: "Tableau", q: "How would you achieve KPI parity between the Power BI and Tableau versions of the same dashboard, as the BRD requires?", a: "Push every calculation possible into the Snowflake mart views (e.g. Stage_Group, Deal_Size_Band, Days_to_Close) rather than re-deriving them separately in DAX and Tableau calculated fields — anything computed twice, in two different tools, is a place the two dashboards can quietly disagree. Anything that must be tool-side (KPI card formatting, trend arrows) gets QA'd side-by-side against the same SQL baseline.", signal: "Tests architectural thinking about parity between two BI tools, a requirement unique to this project." },

  // ---------------- Data Modeling ----------------
  { cat: "Data Modeling", q: "Why does this project use a layered Raw → Staging → Mart schema instead of loading straight into a BI-ready model?", a: "Each layer has one job: Raw preserves an unmodified landing copy of the source export (useful for re-processing if a transformation rule turns out wrong), Staging applies typing, cleaning and derived columns once, and Mart pre-joins staging tables into business-ready views. Skipping straight to a single BI-ready model would mean re-doing the $ and comma cleanup, date normalization, and soft-delete filtering separately inside every BI tool that connects — exactly the duplication the layered approach avoids." },
  { cat: "Data Modeling", q: "What's the grain of fact_opp_product, and why does it matter?", a: "One row per line item on an opportunity, not one row per opportunity — a single deal with 3 products on the quote produces 3 rows. Summing fact_opp_product.Total_Price and comparing it to fact_opportunity.Amount for the same deal won't necessarily match exactly (discounts, partial quoting), so it's used as an optional product-mix extension, not as the primary revenue source for either dashboard." },
  { cat: "Data Modeling", q: "Why does fact_lead have two foreign keys (conv_account_id, conv_opp_id) that are usually NULL?", a: "Because a lead only produces an account and an opportunity once it actually converts — for the ~90% of leads that never convert, those two columns are correctly, expectedly NULL. Treating that as 'missing data' rather than 'the lead hasn't converted yet' would be a misread; the right check is COUNT(conv_opp_id) WHERE Is_Converted=1, not a blanket NOT NULL constraint." },
  { cat: "Data Modeling", q: "Both dim_account and the Opportunity/Lead tables have an 'Industry' field. Why keep it on both, and which one wins?", a: "Account.Industry is the account's current, canonical industry classification; Lead.Industry is a snapshot of what the industry looked like at the moment the lead was captured, which can drift (an account's stated industry can be corrected later). For dashboard filtering, dim_account.Industry is the source of truth — Lead.Industry (and its raw duplicate 'Industry(2)' column, which itself needs coalescing) is really just point-in-time context, not a competing dimension." },

  // ---------------- CRM Domain ----------------
  { cat: "CRM Domain", q: "What's the difference between Lead Conversion Rate and Win Rate — people mix these up.", a: "Lead Conversion Rate measures the marketing-to-sales handoff: what share of raw leads become a qualified account/opportunity (10.3% in this dataset). Win Rate measures sales execution on deals that are already in the pipeline: what share of closed opportunities are won, not lost (42.8% here). A company can have a weak lead-gen funnel but an excellent sales team, or vice versa — the two numbers tell genuinely different stories and should never be reported as if they're the same metric.", signal: "Tests precision on two metrics that sound similar but measure completely different stages of the funnel." },
  { cat: "CRM Domain", q: "Why must Win Rate and Loss Rate both be calculated on closed deals only?", a: "Because an open (still-in-progress) opportunity hasn't resolved yet — it's neither a win nor a loss, and including it in either numerator or denominator distorts the rate. The BRD makes this an explicit acceptance criterion precisely because it's an easy, tempting mistake to divide by all opportunities instead of just the closed ones — get it wrong and Win% + Loss% can add up to more than 100%, a dead giveaway during QA.", signal: "Tests whether you understand the denominator-scoping rule, not just the formula shape." },
  { cat: "CRM Domain", q: "Expected Pipeline Value uses Expected Amount, not Amount. What's the difference?", a: "Amount is the full deal value if won outright. Expected Amount is Amount × Probability(%) — a risk-adjusted projection that discounts a deal still at an early, uncertain stage far more than one nearly closed. Summing raw Amount across every open deal would badly overstate how much revenue is actually likely to land this quarter; Expected Amount is the number a sales director should actually forecast against.", signal: "Tests understanding of probability-weighted forecasting, a core CRM/sales-ops concept." },
  { cat: "CRM Domain", q: "The top two loss reasons in this dataset are 'Non Responsive' and 'Duplicate opportunity.' What does that tell a sales director?", a: "Neither reason is about losing to a competitor or price — both point at process problems: leads/opportunities going cold from insufficient follow-up, and duplicate records being created (likely from lead conversion creating a second opportunity where one already existed). That's a coaching and data-hygiene fix, not a product or pricing fix — a very different corrective action than if 'Chose Competitor' had topped the list.", signal: "Tests whether you can draw an actionable business conclusion from a specific finding, not just describe the chart." },
  { cat: "CRM Domain", q: "Why does the BRD explicitly put 'Real-time Salesforce API integration' out of scope?", a: "Live API sync is a materially bigger engineering lift (auth, rate limits, incremental sync logic, ongoing maintenance) than a periodic flat-file export, and it's not needed to prove the analytics/BI skills this training project is actually testing. Scoping it out lets the team spend the five weeks on ELT design, KPI correctness and dashboard parity — the things actually being graded — instead of Salesforce API plumbing.", signal: "Tests understanding of scope decisions as a training-value tradeoff, not a technical limitation." },

  // ---------------- General & HR ----------------
  { cat: "General & HR", q: "What was your biggest challenge on this project, and how did you solve it?", a: "Pick something concrete and specific to this project — e.g. discovering Lead.Status (Simplified) was 'Open' for every single row and having to fall back to the raw Status column, or catching the Win Rate denominator bug before QA did. State what broke, how you found it, and what you changed.", signal: "The single most common project follow-up after 'explain your project.'" },
  { cat: "General & HR", q: "Describe your process when you're handed a raw Salesforce export with 50-140+ columns per table.", a: "Profile first: which columns are actually populated, which map to the KPIs you need to build, and which are CRM admin/automation noise (notification preferences, UI settings) that can be ignored entirely. Only after that scoping does schema design and cleaning logic start — building derived columns against columns you haven't validated yet just multiplies rework.", signal: "A process question this specific dataset (58-143 raw columns per table) is well suited to answer concretely." },
  { cat: "General & HR", q: "How do you handle a KPI definition disagreement within your team?", a: "This project's own risk register names exactly this (R-005) and its mitigation: sign off KPI formulas at the Phase 4 gate review, before dashboard build starts — not after two team members have already built the same KPI two different ways. Referencing that structure in an answer shows you understand risk management, not just technical delivery.", signal: "Tests whether you can draw on the project's own documented process for a behavioral answer." },
  { cat: "General & HR", q: "Tell me about a time you found an error in your own analysis.", a: "A strong answer names the specific check that caught it — e.g. a QA reconciliation query that showed Win Rate + Loss Rate summing to over 100%, immediately pointing at a wrong denominator — and the fix you applied. Owning the mistake and describing the fix matters more than the mistake itself.", signal: "Tests accountability and self-QA habits." },
  { cat: "General & HR", q: "How would you explain the Opportunity dashboard to a sales director who's never used a BI tool?", a: "Lead with the business question: 'It shows exactly where every open deal sits in the pipeline, how much revenue is realistically expected this quarter, and which reasons are costing us the most lost deals — the same information you'd get from a manual pipeline export, but always current and cross-filterable by industry or rep.' Save 'funnel chart, DAX measure, live Snowflake connection' for if they ask how it's built.", signal: "One of the most common on-the-spot tests in BA/Analyst interviews." },

  // ---------------- Rapid Fire ----------------
  { cat: "Rapid Fire", q: "Win Rate vs Loss Rate — do they have to add up to 100%?", a: "Yes, if both are correctly scoped to closed deals only — Won / (Won+Lost) and Lost / (Won+Lost) are complements. If they don't sum to 100%, one of the two formulas has the wrong denominator.", signal: "Rapid-fire screening question testing the project's own acceptance-criteria trap." },
  { cat: "Rapid Fire", q: "What is a Common Table Expression (CTE) and why use one over a subquery?", a: "A CTE (WITH clause) names a temporary result set for one query — improves readability, allows reuse, and supports recursion, which a plain subquery can't do.", signal: "Rapid-fire L1/L2 screening question." },
  { cat: "Rapid Fire", q: "ELT vs ETL — what's the difference?", a: "ETL transforms data before loading it into the warehouse; ELT loads raw data first, then transforms it in-warehouse using the warehouse's own compute (SQL) — the approach this project uses with Snowflake's Raw → Staging → Mart layers.", signal: "Rapid-fire architecture-terminology screening question." },
  { cat: "Rapid Fire", q: "Live connection vs Extract — one-line difference?", a: "Live sends queries to the source (Snowflake) in real time on every interaction; an Extract snapshots data into the BI tool's own fast in-memory format on a schedule.", signal: "Rapid-fire connection-mode screening question." },
  { cat: "Rapid Fire", q: "Which SQL function have you used the most, and in what context?", a: "Have a real, specific answer ready — e.g. 'REPLACE and CAST for cleaning the Amount column, and DIVIDE-style CASE logic for Win Rate/Loss Rate' — genuinely tied to this project rather than a generic list.", signal: "Interviewers use this to catch candidates who haven't actually written much SQL." },
];

const GLOSSARY = [
  { t: "BRD", d: "Business Requirements Document — the formal document that defines what a project must deliver." },
  { t: "DAX", d: "Data Analysis Expressions — the formula language used in Power BI for calculated columns and measures." },
  { t: "Dimension table", d: "A table of descriptive attributes (e.g. Account, User) used to filter and group fact data." },
  { t: "ELT", d: "Extract, Load, Transform — data is loaded raw into the warehouse first, then transformed in-warehouse using SQL." },
  { t: "Expected Amount", d: "Projected revenue for an open opportunity, typically Amount × Probability (%)." },
  { t: "Fact table", d: "A table of transactional or event data (e.g. Lead, Opportunity) with measures and foreign keys." },
  { t: "KPI", d: "Key Performance Indicator — a quantifiable metric used to evaluate the success of an activity or objective." },
  { t: "Lead", d: "An unqualified prospect; may be converted into an Account and/or Opportunity." },
  { t: "Lead Conversion", d: "The act of promoting a Lead to a customer account when it becomes sales-ready." },
  { t: "Live Connection", d: "A BI tool connection mode where queries are sent to Snowflake in real time — no local data extract." },
  { t: "Loss Rate", d: "Lost Deals / (Won + Lost Deals) × 100. Complements Win Rate; does not include open deals." },
  { t: "Mart View", d: "A Snowflake SQL view in the mart schema that pre-joins dimension and fact tables for BI consumption." },
  { t: "Opportunity", d: "A qualified sales deal tracked through stages from first contact to closed won or lost." },
  { t: "Pipeline", d: "The collection of all active (open) opportunities at any point in time." },
  { t: "QA", d: "Quality Assurance — verifying that outputs meet defined requirements and acceptance criteria." },
  { t: "RACI", d: "Responsible, Accountable, Consulted, Informed — a matrix used to clarify roles and responsibilities." },
  { t: "Stage_Group", d: "A derived field that maps Salesforce's raw stage values to 5 simplified groups for dashboard use." },
  { t: "Win Rate", d: "Won Deals / (Won + Lost Deals) × 100. Only closed deals are included in the denominator." },
  { t: "Grain", d: "The level of detail one row in a fact table represents — e.g. fact_opp_product's grain is one row per line item, not per deal." },
  { t: "Primary key (PK)", d: "The column that uniquely identifies each row in a table." },
  { t: "Foreign key (FK)", d: "A column in one table that references a primary key in another, creating the relationship." },
  { t: "Referential integrity", d: "The guarantee that every foreign key value points to a real row in its parent table — no orphans." },
  { t: "CTE", d: "Common Table Expression — a named, temporary result set defined with WITH, scoped to one query." },
  { t: "Measure (DAX)", d: "A calculation evaluated at query time in the current filter context — e.g. Win Rate." },
  { t: "Calculated column", d: "A value computed row-by-row and stored in the model at refresh time, not query time." },
  { t: "Soft delete", d: "A record marked Deleted=TRUE but still physically present in the export — must be filtered out of every staging/mart query." },
];

/* ---------------- STUDENT TIPS ---------------- */
const TIPS = [
  { n: "01", h: "Tell the project as a story, not a feature list", p: "Data source & scale → architecture → the challenge you hit → the business outcome, in that order. Interviewers remember stories; they don't remember tool lists." },
  { n: "02", h: "Always use real numbers", p: "\"Large dataset\" says nothing. \"10,000 leads and 4,646 opportunities across 5 Salesforce tables, reconciled to Snowflake within ±0.1%\" says everything, and it's defensible if asked a follow-up." },
  { n: "03", h: "Know the 'why', not just the 'what'", p: "Anyone can say 'we built a Win Rate KPI.' Fewer people can explain why it must be scoped to closed deals only, or why the architecture routes through Snowflake instead of connecting BI tools straight to a CSV. The 'why' is what gets tested in follow-ups." },
  { n: "04", h: "Different rounds test different depth", p: "An L1 screen often checks fundamentals (joins, GROUP BY, ELT vs ETL). An L2 round goes architectural (why a layered schema, live connection vs extract, KPI parity across two BI tools). Prep both levels." },
  { n: "05", h: "Lead metrics with the business question they answer", p: "For a sales director, \"Non Responsive and Duplicate opportunity are our top two loss reasons — that's a follow-up problem, not a pricing problem\" beats \"here's a bar chart of loss reasons.\" Practice restating every KPI as a plain-English business question first." },
  { n: "06", h: "Have one specific, honest challenge story ready", p: "Vague answers like \"the data was messy\" read as rehearsed. A specific fix — like catching that Status (Simplified) was useless because every row said 'Open' — reads as real experience." },
  { n: "07", h: "Contribute across every tool, not just your favorite", p: "This capstone is graded on Excel, SQL/Snowflake, Tableau, Power BI and QA together. In interviews, breadth across the stack signals you can work wherever a team needs you." },
  { n: "08", h: "Practice explaining a dashboard to a non-technical stakeholder", p: "Being asked to \"explain this to someone who's never seen a BI tool\" is one of the most common on-the-spot tests — rehearse it out loud before the interview." },
];

const TIP_CALLOUT = "Cracking a data analyst or BI interview isn't about reciting definitions — it's about showing how you think, communicate, and handle messiness: a KPI formula with a denominator trap, a raw export with 140 mostly-irrelevant columns, a stakeholder who wants the pipeline number yesterday. Every question in the Interview Prep tab is really testing one of those things.";

/* ============================================================
   Chart helpers (native SVG — no external images, no dependencies)
   ============================================================ */

function svgDonut(data, size) {
  size = size || 120;
  const total = data.reduce((s, d) => s + d[1], 0);
  const r = size / 2 - 10;
  const cx = size / 2, cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;
  let circles = "";
  data.forEach((d, i) => {
    const frac = total ? d[1] / total : 0;
    const dash = frac * circumference;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CHART_COLORS[i % CHART_COLORS.length]}" stroke-width="16" stroke-dasharray="${dash} ${circumference - dash}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dash;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${circles}</svg>`;
}

function renderDonutBlock(chart) {
  const total = chart.data.reduce((s, d) => s + d[1], 0);
  const legend = chart.data.map((d, i) => {
    const pct = total ? ((d[1] / total) * 100).toFixed(1) : "0.0";
    return `<div class="li"><span class="sw" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>${d[0]} — ${d[1].toLocaleString("en-US")} (${pct}%)</div>`;
  }).join("");
  return `
    <div class="mock-chart">
      <div class="ct">${chart.title}</div>
      <div class="donut-wrap">
        ${svgDonut(chart.data)}
        <div class="mock-legend">${legend}</div>
      </div>
    </div>`;
}

function renderBarBlock(chart) {
  const max = Math.max(...chart.data.map(d => d[1]));
  const suffix = chart.suffix || "";
  const prefix = chart.prefix || "";
  const rows = chart.data.map((d, i) => {
    const pct = max ? (d[1] / max) * 100 : 0;
    const label = typeof d[1] === "number" && !suffix ? d[1].toLocaleString("en-US") : d[1];
    return `
      <div class="bar-row">
        <div class="lab">${d[0]}</div>
        <div class="track"><div class="fill" style="width:${pct}%;background:${CHART_COLORS[i % CHART_COLORS.length]}"></div></div>
        <div class="val">${prefix}${label}${suffix}</div>
      </div>`;
  }).join("");
  return `<div class="mock-chart"><div class="ct">${chart.title}</div>${rows}</div>`;
}

function renderDashMock(d) {
  const kpis = d.kpis.map(k => `<div class="mock-kpi"><div class="v">${k.v}</div><div class="l">${k.l}</div></div>`).join("");
  const donuts = (d.donuts || []).map(renderDonutBlock).join("");
  const bars = (d.bars || []).map(renderBarBlock).join("");
  return `
    <div class="card dash-mock">
      <div class="mock-head"><h4>${d.title}</h4><p>${d.sub}</p></div>
      <div class="mock-kpis">${kpis}</div>
      <div class="mock-charts">${donuts}${bars}</div>
    </div>`;
}

/* ============================================================
   Rendering
   ============================================================ */

function el(tag, cls, html) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
}

function renderStats() {
  const wrap = document.getElementById("stat-strip");
  STATS.forEach(s => {
    const d = el("div", "stat");
    d.innerHTML = `<div class="num">${s.num}</div><div class="lbl">${s.lbl}</div>`;
    wrap.appendChild(d);
  });
}

function renderProblemStatement() {
  const wrap = document.getElementById("problem-grid");
  if (!wrap) return;
  PROBLEM_STATEMENT.forEach(r => {
    const c = el("div", "card rule-card");
    c.innerHTML = `<div class="head"><div class="icon-badge">${r.icon}</div><h4>${r.h}</h4></div><p>${r.p}</p>`;
    wrap.appendChild(c);
  });
}

function renderTools() {
  const wrap = document.getElementById("tool-grid");
  TOOLS.forEach((t, i) => {
    const c = el("div", "card tool-card");
    c.innerHTML = `<img class="tool-logo" src="${t.logo}" alt="${t.name} logo"><h4>${t.name}</h4><div class="role">${t.role}</div><p>${t.desc}</p>`;
    wrap.appendChild(c);
    if (i < TOOLS.length - 1) {
      const arrow = el("div", "tool-arrow", "→");
      wrap.appendChild(arrow);
    }
  });
}

function renderDomainPrimer() {
  document.getElementById("domain-what").textContent = DOMAIN_WHAT;
  document.getElementById("domain-where").innerHTML = DOMAIN_WHERE.map(x => `<div style="padding:5px 0;">• ${x}</div>`).join("");
  document.getElementById("domain-data").innerHTML = DOMAIN_DATA_TYPES.map(x => `<span>${x}</span>`).join("");
}

function renderResourceCards(items, containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  wrap.innerHTML = "";
  items.forEach(d => {
    const c = el("div", "card doc-card");
    const action = d.type === "download"
      ? `<a class="doc-download" href="${d.href}" download="${d.filename}" title="Download ${d.name}">⬇</a>`
      : `<a class="doc-download" href="${d.href}" target="_blank" rel="noopener" title="Open ${d.name}">↗</a>`;
    c.innerHTML = `
      <div class="doc-icon">${d.icon}</div>
      <div class="doc-info"><h4>${d.name}</h4><p>${d.desc}</p></div>
      ${action}
    `;
    wrap.appendChild(c);
  });
}

function renderDocuments() {
  renderResourceCards(DOCUMENTS, "doc-grid");
  renderResourceCards(SOFTWARE_LINKS, "software-grid");
}

function renderFlow() {
  const wrap = document.getElementById("flow-grid");
  FLOW.forEach((f, i) => {
    const d = el("div", "flow-step");
    d.innerHTML = `<div class="idx">${String(i+1).padStart(2,'0')}</div><h4>${f.t}</h4><p>${f.d}</p>`;
    wrap.appendChild(d);
  });
}

function renderTimeline() {
  const wrap = document.getElementById("timeline");
  TIMELINE.forEach(r => {
    const d = el("div", "timeline-row");
    d.innerHTML = `<div class="d">${r.d}</div><div class="t">${r.t}</div><div>${r.task}</div>`;
    wrap.appendChild(d);
  });
}

function renderRules() {
  const wrap = document.getElementById("rule-grid");
  RULES.forEach(r => {
    const c = el("div", "card rule-card" + (r.ok ? " ok" : ""));
    c.innerHTML = `<div class="head"><div class="icon-badge">${r.icon}</div><h4>${r.h}</h4></div><p>${r.p}</p>`;
    wrap.appendChild(c);
  });
  const focus = document.getElementById("focus-grid");
  FOCUS_AREAS.forEach(f => {
    const c = el("div", "card tip-card");
    c.innerHTML = `<h4 style="margin-top:0;">${f.h}</h4><p>${f.p}</p>`;
    focus.appendChild(c);
  });
}

let kpiActiveCat = "All";
let kpiSearch = "";

function renderKpiPills() {
  const wrap = document.getElementById("kpi-pills");
  wrap.innerHTML = "";
  KPI_CATS.forEach(c => {
    const b = el("button", "pill" + (c === kpiActiveCat ? " active" : ""), c);
    b.addEventListener("click", () => { kpiActiveCat = c; renderKpiPills(); renderKpiGrid(); });
    wrap.appendChild(b);
  });
}

function renderKpiGrid() {
  const wrap = document.getElementById("kpi-grid");
  wrap.innerHTML = "";
  const q = kpiSearch.trim().toLowerCase();
  const filtered = KPIS.filter(k => {
    const matchCat = kpiActiveCat === "All" || k.cat === kpiActiveCat;
    const matchQ = !q || (k.name + k.formula + k.table + k.desc).toLowerCase().includes(q);
    return matchCat && matchQ;
  });
  if (!filtered.length) {
    wrap.appendChild(el("div", "empty-state", "No KPIs match that search."));
    return;
  }
  filtered.forEach(k => {
    const c = el("div", "card kpi-card");
    c.innerHTML = `
      <div class="top">
        <h4>${k.name}</h4>
        <span class="tag ${k.prio === 'P1' ? 'p1' : 'p2'}">${k.prio}</span>
      </div>
      <p style="font-size:12.5px;color:var(--ink-muted);margin:0;">${k.desc}</p>
      <div class="formula">${k.formula}</div>
      <div class="meta"><span>${k.table}</span><span>${k.cat} Dashboard</span></div>
    `;
    wrap.appendChild(c);
  });
}

function renderModel() {
  const schema = document.getElementById("schema-grid");
  TABLES.forEach(t => {
    const isFact = t.type.toLowerCase().includes("fact");
    const node = el("div", "table-node" + (isFact ? " fact" : "") + (t.center ? " center" : ""));
    node.innerHTML = `
      <div class="hd"><span>${t.name}</span><span>${t.rows}</span></div>
      <div class="bd">
        <div><span class="pk">${t.pk}</span> · PK</div>
        <div>FK: ${t.fk}</div>
        <div style="margin-top:4px;opacity:.85;">${t.type}</div>
      </div>`;
    schema.appendChild(node);
  });

  const rel = document.getElementById("rel-list");
  rel.innerHTML = `<h4 style="font-size:15px;margin-bottom:6px;">Relationships</h4>`;
  RELATIONSHIPS.forEach(r => {
    const d = el("div", "r");
    d.innerHTML = `<span class="card-arrow">↳</span><span>${r}</span>`;
    rel.appendChild(d);
  });

  document.getElementById("load-order").innerHTML = LOAD_ORDER.map(x => `<div style="padding:5px 0;">${x}</div>`).join("");
  document.getElementById("null-notes").innerHTML = NULL_NOTES.map(x => `<div style="padding:5px 0;">${x}</div>`).join("");
  document.getElementById("calc-fields").innerHTML = CALC_FIELDS.map(x => `<div style="padding:5px 0;">${x}</div>`).join("");

  const gf = document.getElementById("global-filters");
  if (gf) {
    gf.innerHTML = GLOBAL_FILTERS.map(([name, src]) =>
      `<div style="display:flex;justify-content:space-between;gap:16px;padding:7px 0;border-top:1px solid var(--line-soft);"><span style="font-weight:600;color:var(--ink);">${name}</span><span style="font-family:var(--mono);font-size:12px;">${src}</span></div>`
    ).join("");
  }

  const jg = document.getElementById("join-guide-table");
  jg.innerHTML = `
    <thead><tr><th>Type</th><th>Table</th><th>Primary Key</th><th>Foreign Keys</th><th>Joins To</th><th>Grain / Notes</th></tr></thead>
    <tbody>${JOIN_GUIDE.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  `;
  const jp = document.getElementById("join-paths-table");
  jp.innerHTML = `
    <thead><tr><th>Join Name</th><th>Full Join Expression</th></tr></thead>
    <tbody>${JOIN_PATHS.map(r => `<tr><td>${r[0]}</td><td><code>${r[1]}</code></td></tr>`).join("")}</tbody>
  `;

  const t = document.getElementById("dash-table");
  t.innerHTML = `
    <thead><tr><th>#</th><th>Dashboard</th><th>Audience</th><th>Primary KPIs</th><th>Key Visuals</th></tr></thead>
    <tbody>${DASHBOARDS.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
  `;
}

function renderDataDictionary(filterText) {
  const wrap = document.getElementById("datadict-tables");
  if (!wrap) return;
  const q = (filterText || "").trim().toLowerCase();
  wrap.innerHTML = "";

  DATA_DICTIONARY.forEach(t => {
    const rows = t.cols.filter(([col, type, desc, notes]) =>
      !q || (col + type + desc + notes).toLowerCase().includes(q)
    );
    if (!rows.length) return;

    const card = el("div", "card dd-table-card table-scroll");
    card.innerHTML = `
      <div class="hd"><h4>${t.table}</h4><span class="tag p2">${t.rows}</span></div>
      <table class="dtable">
        <thead><tr><th>Column</th><th>Type</th><th>Description</th><th>Notes</th></tr></thead>
        <tbody>${rows.map(([col, type, desc, notes]) => `
          <tr><td>${col}</td><td><span class="col-type">${type}</span></td><td>${desc}</td><td>${notes}</td></tr>
        `).join("")}</tbody>
      </table>
    `;
    wrap.appendChild(card);
  });

  if (!wrap.children.length) {
    wrap.appendChild(el("div", "empty-state", "No columns match that search."));
  }
}

function renderDashboardMocks() {
  const wrap = document.getElementById("dashboard-mocks");
  wrap.innerHTML = DASH_MOCKS.map(renderDashMock).join("");
}

function renderSql() {
  const wrap = document.getElementById("sql-list");
  SQL_BLOCKS.forEach((b, i) => {
    const c = el("div", "card sql-block");
    c.innerHTML = `
      <div class="hd">
        <div><h4>${b.title}</h4><p>${b.desc}</p></div>
        <button class="copy-btn" data-idx="${i}">Copy</button>
      </div>
      <pre>${b.sql.replace(/</g,"&lt;")}</pre>
    `;
    wrap.appendChild(c);
  });
  wrap.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = +btn.dataset.idx;
      navigator.clipboard.writeText(SQL_BLOCKS[idx].sql).then(() => {
        btn.textContent = "Copied ✓";
        btn.classList.add("copied");
        setTimeout(() => { btn.textContent = "Copy"; btn.classList.remove("copied"); }, 1600);
      });
    });
  });
}

/* ---- Interview prep state ---- */
let qaActiveCat = "Explain This Project";
let qaSearch = "";
const PROGRESS_KEY = "axoncrm_prep_progress_v1";
function getProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; } catch(e) { return {}; }
}
function setProgressItem(id, done) {
  const p = getProgress();
  p[id] = done;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
}

function renderQaTabs() {
  const wrap = document.getElementById("qa-tabs");
  wrap.innerHTML = "";
  QA_CATS.forEach(c => {
    const count = QA.filter(q => q.cat === c).length;
    const b = el("button", c === qaActiveCat ? "active" : "", `${c} (${count})`);
    b.addEventListener("click", () => { qaActiveCat = c; renderQaTabs(); renderQaList(); });
    wrap.appendChild(b);
  });
}

function renderQaList() {
  const wrap = document.getElementById("qa-list");
  wrap.innerHTML = "";
  const progress = getProgress();
  const q = qaSearch.trim().toLowerCase();
  const filtered = QA.filter(item => {
    const matchCat = !q ? item.cat === qaActiveCat : true;
    const matchQ = !q || (item.q + item.a).toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  updateProgressBar();

  if (!filtered.length) {
    wrap.appendChild(el("div", "empty-state", "No questions match that search."));
    return;
  }

  filtered.forEach((item) => {
    const id = item.cat + "::" + item.q;
    const done = !!progress[id];
    const card = el("div", "qa-item");
    card.innerHTML = `
      <button class="qa-q">
        <span class="num">${item.cat}</span>
        <span class="qtext">${item.q}</span>
        <span class="chev">⌄</span>
      </button>
      <div class="qa-a"><div class="qa-a-inner">
        <p>${item.a}</p>
        <div class="signal">Interviewer signal: ${item.signal}</div>
        <button class="mark-btn ${done ? 'done' : ''}" style="margin-top:12px;">${done ? '✓ Reviewed' : 'Mark reviewed'}</button>
      </div></div>
    `;
    const qBtn = card.querySelector(".qa-q");
    const aDiv = card.querySelector(".qa-a");
    qBtn.addEventListener("click", () => {
      const isOpen = card.classList.toggle("open");
      aDiv.style.maxHeight = isOpen ? aDiv.scrollHeight + "px" : "0px";
    });
    const markBtn = card.querySelector(".mark-btn");
    markBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const nowDone = !markBtn.classList.contains("done");
      setProgressItem(id, nowDone);
      markBtn.classList.toggle("done", nowDone);
      markBtn.textContent = nowDone ? "✓ Reviewed" : "Mark reviewed";
      updateProgressBar();
    });
    wrap.appendChild(card);
  });
}

function updateProgressBar() {
  const progress = getProgress();
  const total = QA.length;
  const done = QA.filter(item => progress[item.cat + "::" + item.q]).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const progressText = document.getElementById("progress-text");
  const progressBar = document.getElementById("progress-bar");
  if (progressText) progressText.textContent = `${done} / ${total} reviewed`;
  if (progressBar) progressBar.style.width = total ? `${pct}%` : "0%";

  const sideFill = document.getElementById("sidebar-progress-fill");
  const sideCaption = document.getElementById("sidebar-progress-caption");
  if (sideFill) sideFill.style.width = `${pct}%`;
  if (sideCaption) sideCaption.textContent = `${pct}% complete · ${done}/${total} questions reviewed`;
}

function renderGlossary(filterText) {
  const wrap = document.getElementById("gloss-grid");
  const q = (filterText || "").trim().toLowerCase();
  wrap.innerHTML = "";
  const filtered = GLOSSARY.filter(g => !q || (g.t + g.d).toLowerCase().includes(q));
  if (!filtered.length) {
    wrap.appendChild(el("div", "empty-state", "No terms match that search."));
    return;
  }
  filtered.forEach(g => {
    const c = el("div", "card gloss-card");
    c.innerHTML = `<h4>${g.t}</h4><p>${g.d}</p>`;
    wrap.appendChild(c);
  });
}

function renderTips() {
  const wrap = document.getElementById("tip-grid");
  TIPS.forEach(t => {
    const c = el("div", "card tip-card");
    c.innerHTML = `<div class="n">${t.n}</div><h4>${t.h}</h4><p>${t.p}</p>`;
    wrap.appendChild(c);
  });
  document.getElementById("tip-callout").textContent = TIP_CALLOUT;
}

/* ---- Nav (sidebar) ---- */
function switchView(viewName) {
  document.querySelectorAll("#nav button").forEach(x => x.classList.remove("active"));
  const target = document.querySelector(`#nav button[data-view="${viewName}"]`);
  if (target) target.classList.add("active");
  document.querySelectorAll("section.view").forEach(v => v.classList.remove("active"));
  const section = document.getElementById("view-" + viewName);
  if (section) section.classList.add("active");
  window.scrollTo({ top: 0, behavior: "auto" });
  closeMobileSidebar();
}

function initNav() {
  document.querySelectorAll("#nav button").forEach(b => {
    b.addEventListener("click", () => switchView(b.dataset.view));
  });
  document.querySelectorAll("[data-goto]").forEach(b => {
    b.addEventListener("click", () => switchView(b.dataset.goto));
  });
}

function closeMobileSidebar() {
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  if (sidebar) sidebar.classList.remove("open");
  if (scrim) scrim.classList.remove("show");
}

function initMobileToggle() {
  const toggle = document.getElementById("mobile-toggle");
  const sidebar = document.getElementById("sidebar");
  const scrim = document.getElementById("scrim");
  if (!toggle || !sidebar || !scrim) return;
  toggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
    scrim.classList.toggle("show");
  });
  scrim.addEventListener("click", closeMobileSidebar);
}

/* ---- Footer / sidebar / hero social links ---- */
function initSocial() {
  const map = [
    ["side-youtube", SOCIAL.youtube], ["side-medium", SOCIAL.medium], ["side-linkedin", SOCIAL.linkedin],
    ["social-youtube", SOCIAL.youtube], ["social-medium", SOCIAL.medium], ["social-linkedin", SOCIAL.linkedin],
    ["youtube-link", SOCIAL.youtube],
  ];
  map.forEach(([id, url]) => {
    const el = document.getElementById(id);
    if (el && url) el.href = url;
  });
  const footerLinks = document.querySelectorAll(".footer-links a");
  if (footerLinks[0]) footerLinks[0].href = SOCIAL.linkedin;
  if (footerLinks[1]) footerLinks[1].href = SOCIAL.medium;
}

/* ---- Visitor counter ---- */
function initVisitorCounter() {
  const el = document.getElementById("visitor-count");
  if (!el) return;
  const namespace = "axon-crm-analytics-mahendra-singh";
  const key = "site-visits";
  fetch(`https://api.countapi.xyz/hit/${namespace}/${key}`)
    .then(r => r.json())
    .then(data => {
      if (data && typeof data.value === "number") {
        el.textContent = data.value.toLocaleString("en-US");
      } else {
        throw new Error("bad response");
      }
    })
    .catch(() => {
      let local = parseInt(localStorage.getItem("axoncrm_local_visits") || "0", 10);
      local += 1;
      localStorage.setItem("axoncrm_local_visits", String(local));
      el.textContent = local.toLocaleString("en-US");
    });
}

/* ---- Search bindings ---- */
function initSearch() {
  document.getElementById("kpi-search").addEventListener("input", (e) => {
    kpiSearch = e.target.value;
    renderKpiGrid();
  });
  document.getElementById("qa-search").addEventListener("input", (e) => {
    qaSearch = e.target.value;
    renderQaList();
  });
  document.getElementById("gl-search").addEventListener("input", (e) => {
    renderGlossary(e.target.value);
  });
  document.getElementById("dd-search").addEventListener("input", (e) => {
    renderDataDictionary(e.target.value);
  });
}

/* ============================================================
   Ask SIA — chat widget
   Pure client-side keyword search over KPIS, QA and GLOSSARY —
   no API key, no external service, no message limits.
   ============================================================ */

function buildChatIndex() {
  const idx = [];
  KPIS.forEach(k => {
    idx.push({
      type: "KPI", tab: "kpis",
      title: k.name,
      text: `${k.name} ${k.desc} ${k.formula} ${k.table} ${k.cat}`,
      answer: `<strong>${k.name}</strong> (${k.cat} Dashboard) — ${k.desc}<br><span class="src-tag">${k.formula}</span>`,
    });
  });
  QA.forEach(item => {
    idx.push({
      type: "Interview Q&A", tab: "interview",
      title: item.q,
      text: `${item.q} ${item.a} ${item.cat}`,
      answer: `<strong>${item.q}</strong><br>${item.a}`,
    });
  });
  GLOSSARY.forEach(g => {
    idx.push({
      type: "Glossary", tab: "glossary",
      title: g.t,
      text: `${g.t} ${g.d}`,
      answer: `<strong>${g.t}</strong> — ${g.d}`,
    });
  });
  return idx;
}

const STOPWORDS = new Set(["what","is","the","a","an","of","for","how","why","does","do","in","on","to","and","or","this","that","are","was","were","be","it","its","with","vs","versus","between","me","tell","explain","about"]);

function tokenize(s) {
  return s.toLowerCase().replace(/[^a-z0-9%\s]/g, " ").split(/\s+/).filter(w => w && !STOPWORDS.has(w));
}

function searchChatIndex(query, index) {
  const qTokens = tokenize(query);
  if (!qTokens.length) return [];
  const scored = index.map(entry => {
    const textLower = entry.text.toLowerCase();
    const titleLower = entry.title.toLowerCase();
    let score = 0;
    qTokens.forEach(tok => {
      if (titleLower.includes(tok)) score += 3;
      else if (textLower.includes(tok)) score += 1;
    });
    return { entry, score };
  }).filter(r => r.score > 0);
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 2).map(r => r.entry);
}

let chatIndexCache = null;

function chatAppendMessage(html, who) {
  const body = document.getElementById("chat-panel-body");
  const row = el("div", "chat-msg " + who);
  row.innerHTML = `<div class="chat-bubble">${html}</div>`;
  body.appendChild(row);
  body.scrollTop = body.scrollHeight;
}

function chatAnswer(query) {
  if (!chatIndexCache) chatIndexCache = buildChatIndex();
  const results = searchChatIndex(query, chatIndexCache);
  if (!results.length) {
    chatAppendMessage(
      `I couldn't find a close match for that in the KPI list, interview prep or glossary. Try rephrasing with a specific term — e.g. a KPI name, a table name, or a keyword like "win rate" or "stage group".`,
      "bot"
    );
    return;
  }
  results.forEach((r) => {
    const tabLabel = { kpis: "KPI List", interview: "Interview Prep", glossary: "Glossary" }[r.tab];
    const linkBtn = `<br><button type="button" class="chat-link-btn" onclick="switchView('${r.tab}')">Open ${tabLabel} tab →</button>`;
    chatAppendMessage(r.answer + linkBtn, "bot");
  });
}

function initChatWidget() {
  const fab = document.getElementById("chat-fab");
  const panel = document.getElementById("chat-panel");
  const closeBtn = document.getElementById("chat-panel-close");
  const form = document.getElementById("chat-panel-form");
  const input = document.getElementById("chat-input");
  const label = document.getElementById("chat-fab-label");
  if (!fab || !panel || !form) return;

  fab.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open")) {
      input.focus();
      if (label) label.classList.add("hide");
    }
  });
  closeBtn.addEventListener("click", () => {
    panel.classList.remove("open");
    if (label) label.classList.remove("hide");
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    chatAppendMessage(q.replace(/</g, "&lt;"), "user");
    input.value = "";
    setTimeout(() => chatAnswer(q), 150);
  });
}

/* ---- Boot ---- */
document.addEventListener("DOMContentLoaded", () => {
  renderStats();
  renderProblemStatement();
  renderTools();
  renderDomainPrimer();
  renderDocuments();
  renderFlow();
  renderTimeline();
  renderRules();
  renderKpiPills();
  renderKpiGrid();
  renderModel();
  renderDataDictionary();
  renderDashboardMocks();
  renderSql();
  renderQaTabs();
  renderQaList();
  renderGlossary();
  renderTips();
  initNav();
  initMobileToggle();
  initSearch();
  initSocial();
  initVisitorCounter();
  initChatWidget();
});
