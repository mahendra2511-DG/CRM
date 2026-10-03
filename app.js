/* ============================================================
   Axon CRM Analytics — Project & Interview Prep
   data + rendering
   Built from a Salesforce CRM export: Account, Lead, Opportunity,
   Opportunity Product, User → Snowflake ELT → Power BI / Tableau.
   ============================================================ */
const M_KPIS = [
  {
    "name": "Total Leads",
    "desc": "Overall lead volume for the selected period — the base count everything else is measured against.",
    "definition": "The total count of lead records generated during the selected time period, regardless of their current status.",
    "formula": "COUNT(lead_id)",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Converted Leads",
    "desc": "Leads that actually turned into a customer — the numerator of Lead Conversion Rate.",
    "definition": "The count of leads whose Status has moved to Converted — i.e. they now have a linked Account and Opportunity.",
    "formula": "COUNT(lead_id) WHERE Is_Converted = 1",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Lead Conversion Rate",
    "desc": "The single most-watched marketing KPI — what share of leads actually become customers, target-tracked vs. the same period last year.",
    "definition": "The percentage of total leads generated in a period that have converted into an account and opportunity.",
    "formula": "Converted / Total × 100",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Converted Accounts",
    "desc": "Distinct accounts created via lead conversion — not the same number as Converted Leads, since one account can absorb multiple converted leads.",
    "definition": "The number of distinct Account records created as a direct result of lead conversion.",
    "formula": "COUNT(DISTINCT Converted_Account_ID)",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Converted Opportunities",
    "desc": "Distinct opportunities created via lead conversion — the pipeline handoff from marketing to sales.",
    "definition": "The number of distinct Opportunity records created as a direct result of lead conversion.",
    "formula": "COUNT(DISTINCT Converted_Opportunity_ID)",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Expected Revenue (Converted)",
    "desc": "Pipeline value attributable back to converted leads — joins Lead to Opportunity on Converted_Opportunity_ID.",
    "definition": "The total opportunity Amount tied back to opportunities that originated from a converted lead.",
    "formula": "SUM(Amount) joined on Converted_Opportunity_ID",
    "table": "fact_lead, fact_opportunity",
    "cat": "Lead",
    "prio": "P1"
  },
  {
    "name": "Avg Lead Score",
    "desc": "Average Pardot/marketing-automation score across leads that actually have a score — most leads in this dataset have no score at all.",
    "definition": "The average marketing-automation score assigned to leads, used to gauge how sales-ready a lead is.",
    "formula": "AVG(Lead_Score) WHERE Lead_Score IS NOT NULL",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Avg Age of Open Leads",
    "desc": "How long leads that haven't converted yet have been sitting untouched — an early-warning signal for a stalling funnel.",
    "definition": "The average number of days that currently open (non-converted) leads have existed since creation.",
    "formula": "AVG(Age_Days) WHERE Is_Converted = 0",
    "table": "fact_lead",
    "cat": "Lead",
    "prio": "P2"
  },
  {
    "name": "Total Opportunities",
    "desc": "Overall deal volume for the selected period.",
    "definition": "The total count of opportunity (deal) records created during the selected period, irrespective of stage.",
    "formula": "COUNT(opportunity_id)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Active (Open) Opportunities",
    "desc": "Deals still moving through the funnel — not yet Won or Lost.",
    "definition": "The count of opportunities currently sitting in any pipeline stage other than Won or Lost.",
    "formula": "COUNT WHERE Stage_Group NOT IN ('Won','Lost')",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Total Won Revenue",
    "desc": "Booked revenue from closed-won deals — the headline number for a pipeline review.",
    "definition": "The sum of the Amount field for every opportunity marked Won — i.e. booked, closed revenue.",
    "formula": "SUM(Amount) WHERE Won = 1",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Win Rate",
    "desc": "Win rate measured only on closed deals — the BRD's own acceptance criteria specifically flags getting the denominator wrong here as a common bug (Win+Loss rate can exceed 100% if you divide by all opportunities instead of just closed ones). See \"Win Rate vs Conversion Rate\" below — they are not the same KPI.",
    "definition": "The percentage of closed opportunities (Won + Lost) that were actually won.",
    "formula": "COUNT(Won=1) / COUNT(Won=1 OR Lost=1) × 100",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Loss Rate",
    "desc": "The complement of Win Rate — closed deals only, never includes still-open opportunities.",
    "definition": "The percentage of closed opportunities (Won + Lost) that were lost. Win Rate + Loss Rate should always equal 100%.",
    "formula": "COUNT(Won=0, Closed=1) / COUNT(Closed) × 100",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Opportunity Conversion Rate",
    "desc": "Easy to mix up with Win Rate, so interviewers use this pair to test whether you actually understand your own denominator — this one divides by every opportunity ever created, including deals still open, so it will always read lower than Win Rate for the same data. See the comparison table below.",
    "definition": "The percentage of all opportunities created — whether still open, won, or lost — that have gone on to close as Won.",
    "formula": "COUNT(Won=1) / COUNT(opportunity_id) × 100",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Expected Pipeline Value",
    "desc": "Projected revenue still in play — Amount × Probability, summed across every open deal.",
    "definition": "The probability-weighted revenue (Expected_Amount = Amount × Probability) summed across every still-open opportunity.",
    "formula": "SUM(Expected_Amount) WHERE Stage_Group NOT IN ('Won','Lost')",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P1"
  },
  {
    "name": "Avg Deal Size (Won)",
    "desc": "Typical rupee/dollar size of a closed-won deal — a benchmark for deal-sizing conversations.",
    "definition": "The average Amount across every opportunity that closed Won.",
    "formula": "SUM(Amount WHERE Won=1) / COUNT(Won=1)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Avg Days to Close (Won)",
    "desc": "How long a deal that actually closes takes from creation to close — a sales-cycle-length benchmark.",
    "definition": "The average number of days between Created_Date and Close_Date for opportunities that closed Won.",
    "formula": "AVG(Days_to_Close WHERE Won = 1)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Expected vs Forecast Trend",
    "desc": "Shows whether the probability-weighted pipeline is tracking ahead of or behind what sales has manually classified for the same deals — a growing gap here is usually the first thing a sales director asks about in a pipeline review.",
    "definition": "A month-by-month comparison of Expected Amount (system-calculated) against opportunity Amount grouped by Forecast_Category (Pipeline / BestCase / Forecast / Closed / Omitted).",
    "formula": "SUM(Expected_Amount) vs SUM(Amount) GROUP BY Forecast_Category, trended by MONTH(Close_Date)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Active vs Total Opportunities Trend",
    "desc": "Tracks whether the open pipeline is growing, shrinking, or just churning relative to total volume — a flat Active line next to a rising Total line usually means deals are closing faster than new ones are entering.",
    "definition": "A running, month-by-month comparison of the count of currently-open opportunities against the total opportunity count.",
    "formula": "COUNT(Stage_Group NOT IN ('Won','Lost')) vs COUNT(*), trended by MONTH(Created_Date)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Closed Won vs Total Opportunities Trend",
    "desc": "Puts Won Revenue volume in context against total deal volume, so a spike in Won deals can be checked against whether total volume also spiked — in which case win performance didn't actually improve.",
    "definition": "A running, month-by-month comparison of closed-won opportunity count against total opportunity count.",
    "formula": "COUNT(Won=1) vs COUNT(*), trended by MONTH(Close_Date)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Closed Won vs Total Closed Trend",
    "desc": "This is the exact same calculation as Win Rate above, just plotted month by month instead of as one number for the whole period — so the same closed-deals-only denominator rule applies here too. Treat it as \"Win Rate over time\", not a separate metric.",
    "definition": "The month-by-month Win Rate — closed-won opportunities as a percentage of all closed opportunities for that period.",
    "formula": "COUNT(Won=1) / COUNT(Won=1 OR Lost=1) × 100, trended by MONTH(Close_Date)",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Expected Amount by Opportunity Type",
    "desc": "Opportunity_Type is populated for only about 2% of rows in this dataset (mostly \"Safety and Security Opportunity\") — a real sparse-categorical field. Group the unlabeled rows into an explicit 'Unspecified' bucket rather than dropping them, so the total still reconciles to Expected Pipeline Value.",
    "definition": "Expected (probability-weighted) pipeline value broken down by the Opportunity_Type category.",
    "formula": "SUM(Expected_Amount) GROUP BY COALESCE(Opportunity_Type, 'Unspecified')",
    "table": "fact_opportunity",
    "cat": "Opportunity",
    "prio": "P2"
  },
  {
    "name": "Opportunities by Industry",
    "desc": "Requires joining fact_opportunity to dim_account for Industry — it isn't a native fact_opportunity field in the mart, so this is a good join-guide check before you build the visual.",
    "definition": "The count of opportunities broken down by the industry of the account they belong to.",
    "formula": "COUNT(opportunity_id) GROUP BY dim_account.Industry (joined on account_id)",
    "table": "fact_opportunity, dim_account",
    "cat": "Opportunity",
    "prio": "P2"
  }
];

const M_KPI_CATS = ["All", "Lead", "Opportunity"];

/* ---------------- STATS (hero strip) ---------------- */
const M_STATS = [{"num": "10,000", "lbl": "Leads (Jan 2019–Sep 2020)"}, {"num": "4,646", "lbl": "Opportunities"}, {"num": "3,052", "lbl": "Accounts"}, {"num": "5", "lbl": "Source tables → Snowflake"}, {"num": "23", "lbl": "KPIs across 2 dashboards"}];

/* ---------------- DATA MODEL (Snowflake: Raw → Staging → Mart) ---------------- */
const M_TABLES = [
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
const M_RELATIONSHIPS = ["fact_opportunity → dim_account  (account_id, Many:1)", "fact_opportunity → dim_user  (owner_id, Many:1 — 'who owns this deal')", "fact_opp_product → fact_opportunity  (opportunity_id, Many:1)", "fact_lead → dim_account  (conv_account_id, Many:1 — only populated once a lead converts)", "fact_lead → fact_opportunity  (conv_opp_id, Many:1 — only populated once a lead converts)", "fact_lead → dim_user  (created_by_id, Many:1)", "mart.vw_lead_funnel  — pre-joins fact_lead + dim_account + dim_user for Lead Dashboard", "mart.vw_opp_summary  — pre-joins fact_opportunity + dim_account + dim_user for Opportunity Dashboard"];
const M_LOAD_ORDER = ["1. raw.account, raw.lead, raw.opportunity, raw.opp_product, raw.user — COPY INTO from CSV, no transformation", "2. stg.dim_account, stg.dim_user — typed, deduplicated dimensions", "3. stg.fact_lead, stg.fact_opportunity — cleaned facts with derived columns (Stage_Group, Deal_Size_Band, Is_Converted, Age_Days)", "4. mart.vw_lead_funnel, mart.vw_opp_summary — SQL views joining staging fact + dims, this is what Power BI/Tableau actually connect to"];
const M_NULL_NOTES = ["Deleted=TRUE rows are present in every raw table — every staging/mart view must filter WHERE Deleted = 'False' OR Deleted IS NULL, or KPI counts will be inflated by soft-deleted records.", "Opportunity.Amount arrives as text with '$' and commas in the CSV export (e.g. '$54,805.00') — this particular .xlsx already stores it as a clean numeric column, but the raw CSV export used for the actual Snowflake COPY INTO does not; the REPLACE()+CAST() cleanup in the BRD is real and still required in the pipeline.", "Lead.Status (Simplified) is 'Open' for all 10,000 rows in this dataset — a genuine data-quality finding worth flagging rather than treating as a working filter; use the raw Status column (Nurturing / Prospect / Converted / Disqualified / MQL / SQL) instead until Status (Simplified) is fixed upstream.", "Opportunity.Stage has 12 distinct raw values in this dataset (BRD documents up to 15 across the full historical export) — every one must map into Stage_Group (New / Qualified / Late-Stage / Won / Lost) with zero NULLs, or the funnel chart silently drops opportunities.", "Lead.Lead Score is populated for only 603 of 10,000 leads (the rest are blank, not zero) — Avg Lead Score must filter WHERE Lead_Score IS NOT NULL or it understates the average across scored leads.", "Win Rate and Loss Rate must both be scoped to CLOSED deals only (Won=1 OR Lost=1) — dividing by all opportunities instead is the exact bug the BRD's own acceptance criteria (AC-3) calls out, since it lets Win%+Loss% silently exceed 100%."];
const M_CALC_FIELDS = ["Stage_Group — CASE mapping all 12 raw Stage values to New / Qualified / Late-Stage / Won / Lost", "Deal_Size_Band — Small <$10K / Mid $10K–$50K / Large $50K–$200K / Enterprise >$200K, based on Amount", "Days_to_Close — DATEDIFF(day, Created_Date, Close_Date)", "Quarter_Label — CONCAT('Q', QUARTER(Close_Date), '-', YEAR(Close_Date))", "Is_Converted — CASE WHEN Converted='True' THEN 1 ELSE 0 END (Lead)", "Age_Days — DATEDIFF(day, Created_Date, CURRENT_DATE()) (Lead, open leads only)"];
const M_JOIN_GUIDE = [["DIM", "dim_account", "account_id", "—", "fact_opportunity, fact_lead (1:Many)", "1 row per account — 3,052 rows"], ["DIM", "dim_user", "user_id", "—", "fact_opportunity (owner_id), fact_lead (created_by_id)", "1 row per sales rep / user — 98 rows"], ["FACT", "fact_lead", "lead_id", "conv_account_id, conv_opp_id", "dim_account, fact_opportunity", "1 row per lead — 10,000 rows"], ["FACT", "fact_opportunity", "opportunity_id", "account_id, owner_id", "dim_account, dim_user", "1 row per deal — 4,646 rows"], ["FACT", "fact_opp_product", "line_item_id", "opportunity_id", "fact_opportunity", "1 row per line item — 10,000 rows"], ["VIEW", "mart.vw_lead_funnel", "—", "—", "fact_lead + dim_account + dim_user, pre-joined", "Source for the Lead Analytics Dashboard"], ["VIEW", "mart.vw_opp_summary", "—", "—", "fact_opportunity + dim_account + dim_user, pre-joined", "Source for the Opportunity Performance Dashboard"]];
const M_JOIN_PATHS = [["Opportunities by account", "fact_opportunity[account_id] = dim_account[account_id]"], ["Opportunities by owner", "fact_opportunity[owner_id] = dim_user[user_id]"], ["Opportunity line items", "fact_opp_product[opportunity_id] = fact_opportunity[opportunity_id]"], ["Lead conversion → account", "fact_lead[conv_account_id] = dim_account[account_id]"], ["Lead conversion → opportunity", "fact_lead[conv_opp_id] = fact_opportunity[opportunity_id]"], ["Full Lead Dashboard join", "fact_lead ← dim_account, fact_lead ← dim_user (via mart.vw_lead_funnel)"], ["Full Opportunity Dashboard join", "fact_opportunity ← dim_account, fact_opportunity ← dim_user (via mart.vw_opp_summary)"]];
const M_GLOBAL_FILTERS = [["Date Range (Lead)", "fact_lead.Created_Date"], ["Industry (Lead)", "dim_account.Industry"], ["Lead Source (Lead)", "fact_lead.Lead_Source"], ["Lead Status (Lead)", "fact_lead.Status_Simplified"], ["Region (Lead)", "dim_account.Region"], ["Date Range (Opp)", "fact_opportunity.Created_Date / Close_Date, switchable"], ["Stage / Stage Group (Opp)", "fact_opportunity.Stage_Group"], ["Industry (Opp)", "dim_account.Industry"], ["Owner / Sales Rep (Opp)", "dim_user.Owner_Name"], ["Region (Opp)", "dim_account.Region"], ["Deal Size Band (Opp)", "fact_opportunity.Deal_Size_Band"]];
const M_DASHBOARDS = [["1", "Lead Analytics Dashboard", "Marketing Team, Sales Management", "Total Leads, Converted Leads, Lead Conversion Rate, Expected Revenue (Converted)", "Line+Area Trend, Donut (Source), Bar (Stage/Status), Bar (Conversion by Source), Bar (Industry), Summary Table"], ["2", "Opportunity Performance Dashboard", "Sales Managers, Sales Directors", "Active Opportunities, Total Won Revenue, Win Rate, Opportunity Conversion Rate, Expected Pipeline Value, Expected Amount by Opportunity Type, Opportunities by Industry", "Funnel, Multi-Line Trend (Expected vs Forecast, Active vs Total, Closed Won vs Total), Grouped Bar (Win/Lost by Industry), Loss Reason Bar, Expected Pipeline Bar, Top 10 Accounts Table"]];

/* ---------------- DATA DICTIONARY ---------------- */
/* Raw Salesforce exports carry 58-143 columns per table (mostly CRM admin/automation noise). */
/* Only the ~15-20 columns actually used by the KPIs and mart views are documented here. */
const M_DATA_DICTIONARY = [
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
const M_CHART_COLORS = ["#29B5E8", "#1B4F8C", "#DC1F26", "#5B6472", "#7FB6A8", "#F6C445"];
const M_DASH_MOCKS = [
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
const M_SQL_BLOCKS = [
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
const M_PROBLEM_STATEMENT = [
  { icon: "1", ok: false, h: "Siloed Customer Data", p: "Customer and sales data lives disconnected across spreadsheets and manual exports, with no unified view a marketing or sales team can act on." },
  { icon: "2", ok: false, h: "Lack of Real-Time Insights", p: "Lead conversion performance and pipeline health are only visible after manual export and compilation — never current at the moment a decision needs to be made." },
  { icon: "3", ok: false, h: "No KPI-Driven Dashboards", p: "There's no single source of truth for win/loss analysis, lead source performance, or pipeline value — every team reports its own version of the numbers." },
  { icon: "4", ok: false, h: "Poor CRM Reporting Experience", p: "Existing CRM reporting is fragmented and hard to self-serve from, forcing both marketing and sales management back onto manually curated spreadsheet exports for every review." },
];

/* ---------------- TOOLS ---------------- */
const M_TOOLS = [
  { logo: "assets/excel-logo.jpg", name: "Excel", role: "Phase 1-2 · Profile & prep the data", desc: "Profile the raw Account/Lead/Opportunity/Opp Product/User exports, document data-quality issues, and build a first-pass pivot dashboard — at least 3 KPIs visible, no $ symbols left in Amount — before touching Snowflake." },
  { logo: "assets/mysql-logo.png", name: "Snowflake SQL", role: "Phase 3-4 · Raw → Staging → Mart", desc: "Load the 5 source tables into a Raw schema via COPY INTO, clean and type-cast into a Staging schema (dim_account, dim_user, fact_lead, fact_opportunity), then build the two mart views — vw_lead_funnel and vw_opp_summary — that Power BI and Tableau actually connect to." },
  { logo: "assets/tableau-logo.jpg", name: "Tableau", role: "Phase 5 · Connect to Snowflake, not the file", desc: "Tableau connects live to Snowflake's mart views via JDBC/ODBC — never to the raw CSV/XLSX exports. Builds a Tableau version of both the Lead and Opportunity dashboards, matching Power BI's KPI parity." },
  { logo: "assets/powerbi-logo.png", name: "Power BI", role: "Phase 5 · Connect to Snowflake, not the file", desc: "Same rule as Tableau: Power BI connects to Snowflake's mart views (Import or Live/DirectQuery), models relationships around dim_account and dim_user, and builds DAX measures for all 23 KPIs." },
  { logo: "assets/snowflake-icon.png", name: "AI / Insights", role: "Phase 5 (optional) · Ask the warehouse a question", desc: "An optional natural-language layer on top of the same mart views — Snowflake Cortex Analyst, or a Copilot/Power BI Q&A — that lets a non-technical stakeholder type \"what's our win rate this quarter?\" and get an answer, without a separate copy of the data or a third pipeline to maintain." },
  { logo: "assets/mysql-logo.png", name: "QA / SQL", role: "Phase 6 · Reconcile SQL to dashboard", desc: "Run SQL directly against the mart views — counts, sums, win/loss rates — and reconcile every number against Power BI and Tableau within the BRD's ±0.1% tolerance before sign-off." },
];

/* ---------------- DOMAIN PRIMER ---------------- */
const M_DOMAIN_WHAT = "CRM analytics turns the trail every lead, deal and sales activity leaves behind in Salesforce into a measurable picture of the sales and marketing funnel. Instead of marketing tracking lead conversion in disconnected spreadsheets and sales curating manual pipeline exports for every review, one governed Snowflake warehouse and a pair of BI dashboards give both teams a single, reconciled source of truth for where leads come from, how well they convert, and which deals actually close.";

const M_DOMAIN_WHERE = [
  "B2B sales organizations — pipeline visibility across every deal stage, from first contact to closed won or lost.",
  "Marketing teams — lead source performance and conversion-rate tracking to decide where to spend acquisition budget.",
  "Sales management — win-rate and loss-reason analysis for weekly pipeline reviews and quarterly business reviews.",
  "Revenue operations — a governed ELT pipeline (Raw → Staging → Mart) that keeps Power BI and Tableau in sync from one warehouse instead of two disconnected exports.",
];

const M_DOMAIN_DATA_TYPES = [
  "Lead records", "Account records", "Opportunity (deal) records", "Opportunity line items / products",
  "User (sales rep) records", "Pipeline stage history", "Win/loss reasons", "Lead source & conversion data",
];

const M_FLOW = [
  { t: "Data Extraction & Profiling", d: "Profile the 5 raw Salesforce exports (Account, Lead, Opportunity, Opportunity Product, User), document every data-quality issue found in a Data Quality Log." },
  { t: "Data Cleaning & Preparation", d: "Produce clean CSVs and an initial Excel pivot dashboard — strip $ and commas from Amount, normalize dates, filter Deleted=TRUE records." },
  { t: "Snowflake Schema Setup", d: "Load Raw and Staging tables into Snowflake with correct row counts and derived columns (Stage_Group, Deal_Size_Band, Is_Converted, Age_Days)." },
  { t: "Mart Views & Validation", d: "Build vw_lead_funnel and vw_opp_summary, then verify at least 5 KPI values against the Excel baseline within ±1%." },
  { t: "Dashboard Development", d: "Build both dashboards — all 8 KPIs and 6 visuals per dashboard — in Power BI and Tableau, connected live to the Snowflake mart views." },
  { t: "QA & Reconciliation", d: "Complete the QA reconciliation table comparing every SQL KPI value against its dashboard equivalent within ±0.1% tolerance." },
  { t: "Presentation Prep", d: "Assemble the final PPT covering architecture, data model, KPI definitions, wireframes and insights — all 10 required sections." },
];

const M_TIMELINE = [
  { d: "Week 1", t: "Kickoff", task: "Data extraction & profiling — Data Quality Log started" },
  { d: "Week 1-2", t: "Excel", task: "Data cleaning & preparation — Excel pivot dashboard produced" },
  { d: "Week 2", t: "Snowflake", task: "Snowflake Raw + Staging schema setup" },
  { d: "Week 2-3", t: "Snowflake", task: "Mart views (vw_lead_funnel, vw_opp_summary) & validation" },
  { d: "Week 3-4", t: "BI Tools", task: "Dashboard development — Power BI + Tableau, both dashboards" },
  { d: "Week 4", t: "QA / SQL", task: "QA & reconciliation — SQL vs dashboard values ±0.1%" },
  { d: "Week 4-5", t: "Wrap-up", task: "Final presentation prep — all 10 required PPT sections" },
];

/* ---------------- RULES & REGULATIONS ---------------- */
const M_RULES = [
  { icon: "⚠", ok: false, h: "Attendance is mandatory", p: "Missing more than two meetings results in removal from the project. Join every meeting under the same name you registered with — an unrecognized name gets marked absent." },
  { icon: "⚠", ok: false, h: "Attendance alone isn't enough", p: "Sitting in on meetings without actively contributing will also lead to removal. Participation is graded on contribution, not presence." },
  { icon: "✓", ok: true, h: "Flag non-contributing teammates early", p: "If a team member isn't contributing, it's on the group to inform management — by call, WhatsApp, email, or during the weekly review — rather than letting it slide." },
  { icon: "✓", ok: true, h: "Contribute across every tool", p: "You're expected to contribute to Excel, SQL, Tableau, Power BI, and the final PPT. Skipping even one tool entirely puts your place on the project at risk." },
  { icon: "✓", ok: true, h: "Weekly review presentations", p: "Each group presents its progress every week — consistent updates and a prepared walkthrough are expected, not just a working dashboard at the end." },
];

const M_FOCUS_AREAS = [
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
const M_SOCIAL = {
  linkedin: "https://www.linkedin.com/in/mahendra-singh-%F0%9F%87%AE%F0%9F%87%B3%F0%9F%9A%80%E2%9D%84%EF%B8%8F-%F0%9F%90%8D-%F0%9F%A6%84-83699485/",
  medium: "https://medium.com/@mahendraa1188",
  youtube: "https://www.youtube.com/channel/UC2q-vZWSlQpiGiMcSLUqnIg",
};

const M_CRACKANALYTICS_URL = "https://crackanalytics-mahendra-2026.vercel.app/";

/* ---------------- PROJECT DOCUMENTS ---------------- */
const M_DOCUMENTS = [
  { name: "CRM Analytics — BRD.docx", desc: "Full Business Requirements Document — architecture, KPIs, data quality rules, acceptance criteria, glossary", icon: "📄", type: "download", href: "assets/docs/CRM_BRD.docx", filename: "CRM_BRD.docx" },
  { name: "Excel Starter Template.xlsx", desc: "A ready-to-use workbook with live SUMIFS/COUNTIFS formulas for Lead Conversion Rate, Win Rate, Loss Rate, Opportunity Conversion Rate and Expected Pipeline Value — paste your export into Raw_Leads / Raw_Opportunities and the Dashboard tab updates itself", icon: "🧮", type: "download", href: "assets/docs/AXon_CRM_Excel_Starter.xlsx", filename: "AXon_CRM_Excel_Starter.xlsx" },
];

/* ---------------- SETUP & SOFTWARE DOWNLOADS ---------------- */
const M_SOFTWARE_LINKS = [
  { name: "Snowflake trial account", desc: "Free 30-day trial — sign up before Week 1 Day 1, this is the blocking dependency for Phase 3", icon: "❄️", type: "link", href: "https://signup.snowflake.com/" },
  { name: "Tableau Desktop — free download", desc: "Official installer from Tableau (free trial / Public edition)", icon: "📈", type: "link", href: "https://www.tableau.com/products/desktop-free/download" },
  { name: "Power BI Desktop — free download", desc: "Official installer from Microsoft", icon: "⚡", type: "link", href: "https://www.microsoft.com/en-us/download/details.aspx?id=58494" },
];

/* ---------------- INTERVIEW PREP ---------------- */
const M_QA_CATS = ["Explain This Project", "SQL / Snowflake", "Power BI & DAX", "Tableau", "Data Modeling", "CRM Domain", "General & HR", "Rapid Fire"];

const M_QA = [
  // ---------------- Explain This Project ----------------
  { cat: "Explain This Project", q: "Explain this project to me — what did you actually build?", a: "Structure it as a story: (1) the data — a Salesforce CRM export covering Jan 2019–Sep 2020, 5 tables (Account, Lead, Opportunity, Opportunity Product, User), ~28,000 total rows; (2) the architecture — Salesforce → CSV/XLSX export → Python/SQL ELT → Snowflake (Raw → Staging → Mart) → Power BI & Tableau via live connection; (3) the challenge you hit and how you solved it; (4) the outcome — a Lead Analytics Dashboard and an Opportunity Performance Dashboard, 23 KPIs total, reconciled to SQL within ±0.1%. Keep it under two minutes.", signal: "Almost always the first question — tests structure and communication before anything technical." },
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

const M_GLOSSARY = [
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
  { t: "Opportunity Conversion Rate", d: "Won Deals / Total Created Deals × 100 — includes deals still open in the denominator, unlike Win Rate. Always reads lower than Win Rate for the same data." },
  { t: "Win Rate vs. Conversion Rate (the trap)", d: "Both put \"Won\" on top, but they divide by different things — Win Rate by closed deals only, Conversion Rate by every deal ever created. Mixing them up is this project's single most common QA bug; see the comparison table in the KPI List tab." },
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
const M_TIPS = [
  { n: "01", h: "Tell the project as a story, not a feature list", p: "Data source & scale → architecture → the challenge you hit → the business outcome, in that order. Interviewers remember stories; they don't remember tool lists." },
  { n: "02", h: "Always use real numbers", p: "\"Large dataset\" says nothing. \"10,000 leads and 4,646 opportunities across 5 Salesforce tables, reconciled to Snowflake within ±0.1%\" says everything, and it's defensible if asked a follow-up." },
  { n: "03", h: "Know the 'why', not just the 'what'", p: "Anyone can say 'we built a Win Rate KPI.' Fewer people can explain why it must be scoped to closed deals only, or why the architecture routes through Snowflake instead of connecting BI tools straight to a CSV. The 'why' is what gets tested in follow-ups." },
  { n: "04", h: "Different rounds test different depth", p: "An L1 screen often checks fundamentals (joins, GROUP BY, ELT vs ETL). An L2 round goes architectural (why a layered schema, live connection vs extract, KPI parity across two BI tools). Prep both levels." },
  { n: "05", h: "Lead metrics with the business question they answer", p: "For a sales director, \"Non Responsive and Duplicate opportunity are our top two loss reasons — that's a follow-up problem, not a pricing problem\" beats \"here's a bar chart of loss reasons.\" Practice restating every KPI as a plain-English business question first." },
  { n: "06", h: "Have one specific, honest challenge story ready", p: "Vague answers like \"the data was messy\" read as rehearsed. A specific fix — like catching that Status (Simplified) was useless because every row said 'Open' — reads as real experience." },
  { n: "07", h: "Contribute across every tool, not just your favorite", p: "This capstone is graded on Excel, SQL/Snowflake, Tableau, Power BI and QA together. In interviews, breadth across the stack signals you can work wherever a team needs you." },
  { n: "08", h: "Practice explaining a dashboard to a non-technical stakeholder", p: "Being asked to \"explain this to someone who's never seen a BI tool\" is one of the most common on-the-spot tests — rehearse it out loud before the interview." },
];

const M_TIP_CALLOUT = "Cracking a data analyst or BI interview isn't about reciting definitions — it's about showing how you think, communicate, and handle messiness: a KPI formula with a denominator trap, a raw export with 140 mostly-irrelevant columns, a stakeholder who wants the pipeline number yesterday. Every question in the Interview Prep tab is really testing one of those things.";

/* ---------------- LEARN MORE / EXTERNAL LINKS ---------------- */
const M_LEARNING_LINKS = [
  { title: "What is CRM? (Salesforce Trailhead)", desc: "The free, official starting point for CRM fundamentals — customer data, the sales/marketing funnel, and why companies centralize it.", url: "https://trailhead.salesforce.com/content/learn/modules/what_is_crm", source: "Salesforce" },
  { title: "CRM Analytics Basics (Salesforce Trailhead)", desc: "Official Salesforce module on building dashboards and reading insights on top of CRM data — the platform this project's source data was exported from.", url: "https://trailhead.salesforce.com/content/learn/modules/wave_analytics_basics", source: "Salesforce" },
  { title: "Snowflake in 20 Minutes (official tutorial)", desc: "Snowflake's own quick-start — databases, warehouses, loading data and running your first queries. Do this before Phase 3 of this project.", url: "https://docs.snowflake.com/en/user-guide/getting-started-tutorial", source: "Snowflake" },
  { title: "Snowflake Tutorials Hub (official docs)", desc: "Official, longer tutorials for data loading (COPY INTO) and data engineering — directly relevant to the Raw → Staging → Mart pipeline you're building.", url: "https://docs.snowflake.com/en/learn-tutorials", source: "Snowflake" },
  { title: "Tableau — Free Training Videos", desc: "Tableau's own on-demand video library, organized into beginner-friendly learning paths — connecting to data, building your first viz, and dashboards.", url: "https://www.tableau.com/learn/training", source: "Tableau" },
  { title: "Power BI Learning Paths (Microsoft Learn)", desc: "Microsoft's free, structured, hands-on modules for Power BI — data modeling, DAX measures, and report building, with in-browser labs.", url: "https://learn.microsoft.com/en-us/training/powerplatform/power-bi", source: "Microsoft" },
  { title: "Free SQL Tutorial — Joins & Aggregations (Mode)", desc: "A free, interactive SQL tutorial covering exactly the joins and GROUP BY logic this project's mart views and QA queries depend on.", url: "https://mode.com/sql-tutorial/", source: "Mode Analytics" },
  { title: "Win Rate vs. Conversion Rate, Explained", desc: "A plain-English breakdown of the exact KPI mix-up this project's QA round tests for — good outside reading alongside the comparison table in the KPI List tab.", url: "https://www.scratchpad.com/blog/win-rate", source: "Scratchpad" },
];

/* ---------------- KEY INSIGHTS & RECOMMENDATIONS ---------------- */
const M_KEY_INSIGHTS = [
  { insight: "Win Rate lands at 42.8% against a Loss Rate of 57.2%, with 'Non Responsive' and 'Duplicate opportunity' as the two dominant loss reasons — neither is a pricing or competitor problem.", recommendation: "Route this to sales operations as a follow-up-cadence and lead-deduplication fix, not to product or pricing — coaching and process changes will move this number more than a discount strategy." },
  { insight: "Lead Conversion Rate is only 10.3% (1,033 of 10,000 leads) — a materially different number from, and often confused with, Win Rate.", recommendation: "Report the two side by side with their own denominators explicitly labeled, so leadership doesn't conflate a marketing-funnel problem with a sales-execution one." },
  { insight: "Lead.Status (Simplified) reads 'Open' for all 10,000 rows in this dataset — the field is effectively broken, not just imbalanced.", recommendation: "Never build a filter or KPI on Status (Simplified) as-is; use the raw Status column (Nurturing / Prospect / Converted / Disqualified / MQL / SQL) until the simplified field is fixed upstream, and flag it to the data owner rather than silently working around it forever." },
  { insight: "Lead Score is populated for only 603 of 10,000 leads (about 6%) — the vast majority of leads have never been scored.", recommendation: "Report Lead Score coverage (6%) alongside Avg Lead Score itself — a healthy-looking average computed over such a tiny scored subset can hide a much weaker real funnel." },
  { insight: "Soft-deleted rows (Deleted=TRUE) exist in every raw table but remain physically present in the export.", recommendation: "Bake the WHERE Deleted='False' filter into the mart view itself, not into each individual dashboard query — a filter that has to be repeated in five places will eventually be missed in one of them." },
  { insight: "Won Revenue totals roughly $136.26M against an Expected Pipeline of $47.88M still in play.", recommendation: "Track the ratio of Expected Pipeline to trailing Won Revenue over time as a leading indicator — a shrinking ratio quarter over quarter often signals a slowing pipeline before bookings actually drop." }
];

/* ---------------- RESUME BULLET POINTS ---------------- */
const M_RESUME_BULLETS = [
  "Built a Lead Analytics Dashboard and an Opportunity Performance Dashboard in Power BI and Tableau, analyzing 10,000 leads and 4,646 opportunities, reconciling 23 KPIs to SQL within ±0.1%.",
  "Diagnosed that a 'Status (Simplified)' field was broken (reading 'Open' for all 10,000 leads) and re-routed every KPI to the raw Status column instead, preventing a silently wrong funnel dashboard.",
  "Identified 'Non Responsive' and 'Duplicate opportunity' as the top two loss reasons behind a 57.2% Loss Rate, reframing a perceived pricing problem as a sales-process and data-hygiene fix."
];

/* ---------------- 2-MINUTE ELEVATOR PITCH ---------------- */
const M_ELEVATOR_PITCH = "I built an end-to-end CRM analytics project using a real Salesforce export — about 10,000 leads and 4,646 opportunities. I took that data through Excel, a layered Snowflake pipeline (Raw, Staging, Mart), and built a Lead Analytics Dashboard and an Opportunity Performance Dashboard in both Power BI and Tableau. The trickiest part was a genuine data-quality bug: the Lead.Status (Simplified) field read 'Open' for literally every one of the 10,000 leads, so I had to fall back to the raw Status column for anything funnel-related instead of trusting the field the BRD pointed me to. On the insights side, I found Win Rate sitting at 42.8% with 'Non Responsive' and 'Duplicate opportunity' as the top two loss reasons — that's a sales-process and data-hygiene story, not a pricing or competitor story, which changes what leadership should actually do about it. I reconciled all 23 KPIs between SQL and both BI tools to within a tenth of a percent before calling it done.";

/* ---------------- PROJECT-SPECIFIC FAQ ---------------- */
const M_PROJECT_FAQ = [
  { q: "What if the interviewer isn't technical — how much detail should I give?", a: "Lead with the business framing (marketing and sales each reporting their own version of funnel numbers) and the outcome (two dashboards, a real broken-field catch), and only go into SQL/DAX/Tableau specifics if they ask a follow-up." },
  { q: "What if I only worked on one part of this project (e.g. just Power BI, not the Snowflake pipeline)?", a: "Say so plainly and describe your part in depth — a specific, detailed answer about the piece you actually own is far stronger than a vague answer implying you did all of it." },
  { q: "What if they ask why you chose a CRM dataset specifically?", a: "A good honest answer: it forces you to deal with a genuinely broken field (Status Simplified) and a real denominator trap (Win Rate vs. Conversion Rate) — better tests of real judgment than a clean, pre-cleaned dataset would be." },
  { q: "What if they ask what you'd do differently with more time?", a: "Have one real answer ready — e.g. Lead Score is populated for only 6% of leads; a real next step would be pushing back to the source system about why scoring coverage is so low before trusting any lead-quality conclusion built on it." },
  { q: "What if they push on why you used two BI tools instead of just one?", a: "This capstone specifically requires KPI parity across both Power BI and Tableau as a reconciliation exercise — say that directly, and note that in a real job you'd typically pick one tool per organization." },
  { q: "What if you freeze or forget a specific number mid-answer?", a: "Say what you do remember directionally (\"win rate is a bit under half of closed deals\") rather than guessing a fake precise number — a confident approximate answer reads better than a wrong exact one." }
];

/* ============================================================
   AXon CRM Analytics — Capstone, Practice & Interview Prep Hub
   Numbers come from crm-data.js (window.CRM), generated from the
   CRM Project dataset (Account, Lead, Opportunity, Opportunity
   Product, User). Original project content lives in 00-orig.js.
   ============================================================ */
const CRM = window.CRM || {};
const A = CRM.A || {};
const MD = CRM.M || {};
const fmtN = (n) => Number(n).toLocaleString("en-IN");
const fmtUS = (n) => Number(n).toLocaleString("en-US");
const f1 = (n) => (Math.round(n * 10) / 10).toFixed(1);
const f2 = (n) => Number(n).toFixed(2);
const usdM = (n) => "$" + (Number(n) / 1e6).toFixed(2) + "M";
const CERTIVA_URL = "https://www.certiva.co.in/";
const CRACKANALYTICS_URL = M_CRACKANALYTICS_URL;

/* ---------------- KPIs (original 23-KPI list) ---------------- */
const KPI_Q = {
  "Total Leads": "How many leads did marketing generate?",
  "Converted Leads": "How many leads became customers?",
  "Lead Conversion Rate": "What share of leads turn into an account and opportunity?",
  "Converted Accounts": "How many new accounts came from lead conversion?",
  "Converted Opportunities": "How many deals did converted leads create?",
  "Expected Revenue (Converted)": "How much deal value can we trace back to marketing leads?",
  "Avg Lead Score": "How good are the leads we score?",
  "Avg Age of Open Leads": "How long do unconverted leads sit in the funnel?",
  "Total Opportunities": "How many deals are in Salesforce?",
  "Active (Open) Opportunities": "How many deals are still being worked?",
  "Total Won Revenue": "How much revenue have we closed?",
  "Win Rate": "Of the deals we closed, how many did we win?",
  "Loss Rate": "Of the deals we closed, how many did we lose?",
  "Opportunity Conversion Rate": "Of every deal created, how many ended as a win?",
  "Expected Pipeline Value": "What is the open pipeline worth, weighted by probability?",
  "Avg Deal Size (Won)": "How big is a typical won deal?",
  "Avg Days to Close (Won)": "How long does it take to win a deal?",
  "Expected vs Forecast Trend": "Is weighted pipeline keeping up with raw deal value over time?",
  "Active vs Total Opportunities Trend": "How much of what we create each month is still open?",
  "Closed Won vs Total Opportunities Trend": "How many deals do we win each month vs how many we have?",
  "Closed Won vs Total Closed Trend": "Is our win rate improving month by month?",
  "Expected Amount by Opportunity Type": "Which opportunity types carry the pipeline value?",
  "Opportunities by Industry": "Which industries generate the most deals?",
};
const KPI_DAX = {
  "Total Leads": "Total Leads = COUNTROWS ( fact_lead )",
  "Converted Leads": "Converted Leads = CALCULATE ( [Total Leads], fact_lead[Is_Converted] = 1 )",
  "Lead Conversion Rate": "Lead Conversion Rate = DIVIDE ( [Converted Leads], [Total Leads] )",
  "Converted Accounts": "Converted Accounts = DISTINCTCOUNTNOBLANK ( fact_lead[conv_account_id] )",
  "Converted Opportunities": "Converted Opportunities = DISTINCTCOUNTNOBLANK ( fact_lead[conv_opp_id] )",
  "Expected Revenue (Converted)": "Expected Revenue (Converted) = CALCULATE ( SUM ( fact_opportunity[Amount] ), fact_opportunity[Created_by_Lead_Conversion] = TRUE () )  -- or TREATAS over fact_lead[conv_opp_id]",
  "Avg Lead Score": "Avg Lead Score = AVERAGE ( fact_lead[Lead_Score] )  -- AVERAGE ignores BLANK",
  "Avg Age of Open Leads": "Avg Age of Open Leads = AVERAGEX ( FILTER ( fact_lead, fact_lead[Is_Converted] = 0 ), DATEDIFF ( fact_lead[Created_Date], [As Of Date], DAY ) )",
  "Total Opportunities": "Total Opportunities = COUNTROWS ( fact_opportunity )",
  "Active (Open) Opportunities": "Active Opportunities = CALCULATE ( [Total Opportunities], fact_opportunity[Closed] = FALSE () )",
  "Total Won Revenue": "Total Won Revenue = CALCULATE ( SUM ( fact_opportunity[Amount] ), fact_opportunity[Won] = TRUE () )",
  "Win Rate": "Win Rate = DIVIDE ( CALCULATE ( [Total Opportunities], fact_opportunity[Won] = TRUE () ), CALCULATE ( [Total Opportunities], fact_opportunity[Closed] = TRUE () ) )",
  "Loss Rate": "Loss Rate = DIVIDE ( CALCULATE ( [Total Opportunities], fact_opportunity[Closed] = TRUE (), fact_opportunity[Won] = FALSE () ), CALCULATE ( [Total Opportunities], fact_opportunity[Closed] = TRUE () ) )",
  "Opportunity Conversion Rate": "Opp Conversion Rate = DIVIDE ( CALCULATE ( [Total Opportunities], fact_opportunity[Won] = TRUE () ), [Total Opportunities] )",
  "Expected Pipeline Value": "Expected Pipeline = CALCULATE ( SUM ( fact_opportunity[Expected_Amount] ), fact_opportunity[Closed] = FALSE () )",
  "Avg Deal Size (Won)": "Avg Deal Size = CALCULATE ( AVERAGE ( fact_opportunity[Amount] ), fact_opportunity[Won] = TRUE () )",
  "Avg Days to Close (Won)": "Avg Days to Close = CALCULATE ( AVERAGE ( fact_opportunity[Days_to_Close] ), fact_opportunity[Won] = TRUE (), fact_opportunity[Days_to_Close] >= 0 )",
  "Expected vs Forecast Trend": "Line chart: dim_date[Month] (Close Date) · [Expected Pipeline] and SUM(Amount) as two lines",
  "Active vs Total Opportunities Trend": "Line chart on Created Date: [Active Opportunities] vs [Total Opportunities], with USERELATIONSHIP to Created_Date",
  "Closed Won vs Total Opportunities Trend": "Line chart on Close Date: CALCULATE([Total Opportunities], Won = TRUE()) vs [Total Opportunities]",
  "Closed Won vs Total Closed Trend": "Line chart on Close Date: [Win Rate] by month (closed deals only in the denominator)",
  "Expected Amount by Opportunity Type": "Bar: COALESCE-style column Opp_Type_Clean (blank → \"Unspecified\") + SUM(Expected_Amount)",
  "Opportunities by Industry": "Bar: dim_account[Industry] + [Total Opportunities]; blank industry shown as \"Unknown\"",
};
const KPI_V = {
  "Total Leads": fmtUS(A.leads), "Converted Leads": fmtUS(A.conv), "Lead Conversion Rate": f2(A.convrate) + "%", "Converted Accounts": fmtUS(A.conv_acc),
  "Converted Opportunities": fmtUS(A.conv_opp), "Expected Revenue (Converted)": usdM(A.exp_rev_conv), "Avg Lead Score": f2(A.avg_score) + " (603 scored leads)",
  "Avg Age of Open Leads": f1(A.age_open) + " days (as of 31-Dec-2021)", "Total Opportunities": fmtUS(A.opps), "Active (Open) Opportunities": fmtUS(A.active),
  "Total Won Revenue": usdM(A.won_rev), "Win Rate": f2(A.winrate) + "%", "Loss Rate": f2(A.lossrate) + "%", "Opportunity Conversion Rate": f2(A.oppconv) + "%",
  "Expected Pipeline Value": usdM(A.pipe), "Avg Deal Size (Won)": "$" + fmtUS(Math.round(A.avgdeal)), "Avg Days to Close (Won)": f1(A.d2c_mean) + " days (median " + Math.round(A.d2c_median) + ")",
  "Expected vs Forecast Trend": "Open: $47.88M weighted vs $247.48M unweighted", "Active vs Total Opportunities Trend": "1,272 of 4,646 still open",
  "Closed Won vs Total Opportunities Trend": "2020: 445 won · 2021: 294 won", "Closed Won vs Total Closed Trend": "2020: 42.0% · 2021: 45.9%",
  "Expected Amount by Opportunity Type": "Type blank on 4,555 of 4,646 opps", "Opportunities by Industry": "Biopharma/Pharma 1,143 (top) · 321 blank",
};
const KPI_WRONG = {
  "Win Rate": "31.06% if you divide by all 4,646 opportunities; 46.76% if 'closed' is guessed from Closed_Lost_Reason",
  "Loss Rate": "41.56% if you divide by all opportunities (Win + Loss no longer add to 100%)",
  "Lead Conversion Rate": "9.07% if you count Status = 'Converted' (907 rows) instead of the Converted flag (1,033)",
  "Converted Opportunities": "411 if you COUNT instead of COUNT DISTINCT (36 leads share a deal)",
  "Total Won Revenue": "3.1× too high if you SUM Amount after joining Opportunity Product ($336.72M vs $108.73M for the line-item deals)",
  "Avg Lead Score": "0.09 if blank scores are treated as 0",
  "Avg Days to Close (Won)": `244 won deals close before they were created; excluding them the mean is ${f1(A.d2c_pos_mean)} days`,
  "Avg Deal Size (Won)": "$94,429 if the 14 blank won Amounts count as $0",
};
const KPI_TIER = {
  "Total Leads": "P1", "Converted Leads": "P1", "Lead Conversion Rate": "P1", "Total Opportunities": "P1", "Active (Open) Opportunities": "P1", "Total Won Revenue": "P1", "Win Rate": "P1", "Expected Pipeline Value": "P1",
  "Converted Accounts": "P2", "Converted Opportunities": "P2", "Expected Revenue (Converted)": "P2", "Loss Rate": "P2", "Opportunity Conversion Rate": "P2", "Avg Deal Size (Won)": "P2", "Avg Days to Close (Won)": "P2", "Avg Lead Score": "P2",
};
const KPIS = M_KPIS.map((k, i) => ({
  id: "k" + (i + 1), name: k.name, cat: k.cat, q: KPI_Q[k.name] || k.definition, desc: k.desc, plain: k.definition, formula: k.formula, dax: KPI_DAX[k.name] || "",
  table: k.table, v25: KPI_V[k.name] || "—", wrong: KPI_WRONG[k.name] || "", prio: KPI_TIER[k.name] || "P3",
  dir: /Loss|Days|Age/.test(k.name) ? "lower is better" : "higher is better",
}));
const KPI_CATS = M_KPI_CATS;

/* ---------------- STATS (hero strip) ---------------- */
const STATS = [
  { num: fmtUS(A.leads), lbl: "Leads (mostly 2020–2021)" },
  { num: fmtUS(A.opps), lbl: "Opportunities" },
  { num: fmtUS(A.accounts), lbl: "Accounts · 98 users" },
  { num: "8 → 23", lbl: "Must-know P1 KPIs → full list" },
  { num: f1(A.winrate) + "%", lbl: "Win rate (closed deals)" },
];

/* ---------------- LEARNING JOURNEY ---------------- */
const JOURNEY = [
  { id: "j1", t: "Understand the Business Problem", d: "Read the problem statement, the BRD requirements and the 8 business questions. Write down, in one line, what marketing and sales leadership want to decide.", go: "problem", track: "business" },
  { id: "j2", t: "Explore the Dataset", d: "Open all 5 Salesforce exports (58–143 columns each). Note each table's grain, keys and the columns you'll actually use; spot the '$' text in Amount and the empty Region column.", go: "dataset", track: "business" },
  { id: "j3", t: "Build the Data Model", d: "Raw → Staging → Mart in Snowflake: dim_account, dim_user, fact_lead, fact_opportunity, fact_opp_product, then the two mart views.", go: "model", track: "model" },
  { id: "j4", t: "Clean & Validate the Data", d: "Run the data-quality checks: Amount text, orphan Account IDs, negative days-to-close, future close dates, Status vs Converted flag. Fill the Data Quality Log.", go: "quality", track: "model" },
  { id: "j5", t: "Write SQL Queries", d: "COPY INTO the raw tables, build staging and the mart views, then run the KPI and QA queries in the SQL Lab.", go: "sql", track: "sql" },
  { id: "j6", t: "Create KPIs", d: "Implement the 8 P1 KPIs first: leads, converted leads, conversion rate, opportunities, active, won revenue, win rate, expected pipeline. Then the rest of the 23.", go: "kpis", track: "kpi" },
  { id: "j7", t: "Build the Tableau Dashboard", d: "Connect Tableau live to the Snowflake mart views and build the Lead Analytics and Opportunity Performance dashboards.", go: "dashboards", track: "tableau" },
  { id: "j8", t: "Build the Power BI Dashboard", d: "Same two dashboards in Power BI: DAX measures, a Date table with Created/Close Date roles, and USERELATIONSHIP.", go: "dashboards", track: "powerbi" },
  { id: "j9", t: "Perform QA", d: "Reconcile every KPI between SQL, Tableau and Power BI within ±0.1%. Fill in the reconciliation table and sign off the checklist.", go: "qa", track: "qa" },
  { id: "j10", t: "Present Your Business Insights", d: "Turn the numbers into 5 insights and 5 recommendations, rehearse the 90-second pitch, and practise the Salesforce + Power BI interview questions.", go: "analysis", track: "career" },
];

/* ---------------- DELIVERABLES ---------------- */
const DELIVERABLES = [
  { id: "d1", t: "Business Requirement Document", d: "Problem, stakeholders, requirements, KPI list, wireframes for both dashboards.", where: "Problem & Business Questions", track: "business" },
  { id: "d2", t: "Data Quality Log", d: "Every issue found in the 5 exports, its impact and the fix.", where: "Data Quality", track: "model" },
  { id: "d3", t: "Data Model", d: "Snowflake Raw → Staging → Mart with keys, grain and relationships.", where: "Data Model", track: "model" },
  { id: "d4", t: "SQL Scripts", d: "COPY INTO, staging transforms, mart views and QA queries, saved as .sql files.", where: "SQL Lab", track: "sql" },
  { id: "d5", t: "KPI Definitions", d: "Business question, formula and DAX for all 23 KPIs.", where: "KPI Library", track: "kpi" },
  { id: "d6", t: "Excel Analysis", d: "First-pass pivot dashboard with at least 3 KPIs and clean numeric Amount.", where: "Excel Analysis", track: "excel" },
  { id: "d7", t: "Tableau Dashboard", d: "Lead Analytics + Opportunity Performance, live-connected to Snowflake (.twbx).", where: "Dashboard Gallery", track: "tableau" },
  { id: "d8", t: "Power BI Dashboard", d: "Same two dashboards in Power BI (.pbix) with the DAX measures.", where: "Dashboard Gallery", track: "powerbi" },
  { id: "d9", t: "QA Validation", d: "Reconciliation sheet: SQL vs Tableau vs Power BI for every P1 KPI.", where: "QA & Reconciliation", track: "qa" },
  { id: "d10", t: "Business Insights", d: "5 insights + 5 recommendations backed by numbers.", where: "Business Analysis", track: "career" },
  { id: "d11", t: "Project Presentation", d: "All 10 PPT sections from the BRD: architecture, model, KPIs, wireframes, insights.", where: "90-sec Project Pitch", track: "career" },
  { id: "d12", t: "Resume Project Description", d: "Copy-ready project block and 3 tailored bullets.", where: "Resume, LinkedIn & Portfolio", track: "career" },
];

/* ---------------- BEFORE vs AFTER ---------------- */
const BEFORE_AFTER = {
  before: ["Lead and deal data exported manually from Salesforce into spreadsheets", "Marketing and sales each report their own conversion and win numbers", "Pipeline value argued deal by deal in weekly reviews", "No view of which lead sources actually produce customers", "Loss reasons never analysed", "No single source of truth for leadership"],
  after: ["Snowflake ELT (Raw → Staging → Mart)", "Validated data (Data Quality Log)", "Standard definitions for 23 KPIs", "Power BI & Tableau dashboards", "Business insights → decisions"],
};

/* ---------------- PROBLEM STATEMENT (original) ---------------- */
const PROBLEM_STATEMENT = M_PROBLEM_STATEMENT;
const REQUIREMENTS = [
  ["R1", "Lead Analytics Dashboard", "Marketing team, Sales management", "Total leads, converted leads, conversion rate, expected revenue from converted leads, trend by month", "P1"],
  ["R2", "Lead source & status view", "Marketing", "Leads and conversion rate by source, status mix, industry, lead score coverage", "P1"],
  ["R3", "Opportunity Performance Dashboard", "Sales managers, Sales directors", "Active opportunities, won revenue, win rate, loss rate, expected pipeline, avg deal size, days to close", "P1"],
  ["R4", "Win/loss analysis", "Sales directors", "Win vs lost by industry, top loss reasons, stage funnel", "P1"],
  ["R5", "Rep & account view", "Sales management", "Won revenue and win rate by owner, top accounts", "P2"],
  ["R6", "Trend KPIs", "Sales management", "Expected vs forecast, active vs total, won vs total, won vs closed by month", "P2"],
  ["R7", "Global filters", "All users", "Date (Created / Close), industry, lead source, stage group, owner on every page", "P1"],
  ["R8", "Data governance", "QA reviewer", "Same KPI definitions in SQL, Power BI and Tableau; reconcile within ±0.1%", "P1"],
];

/* ---------------- BUSINESS QUESTIONS ---------------- */
function bq() {
  return [
    { q: "Which lead sources actually produce customers?", data: "Lead (Lead Source, Converted)", kpi: "Lead Conversion Rate by source",
      analysis: "Count leads and converted leads by Lead Source (sources with 100+ leads), compute conversion %, and compare volume with quality.",
      insight: `Inside Sales brings the most leads (${fmtUS(A.inside_n)}) but converts only ${f1(A.inside_conv)}%. Field Sales converts 28.2% and Website 23.1%. Overall conversion is ${f2(A.convrate)}%.`,
      rec: "Review how Inside Sales leads are qualified before they're logged, and shift nurture budget toward Website and field-generated leads." },
    { q: "Why do we lose deals?", data: "Opportunity (Closed Lost Reason, Won, Closed)", kpi: "Loss Rate, loss reasons",
      analysis: "Count closed-lost deals by Closed Lost Reason, including blanks; recompute win rate without duplicate opportunities.",
      insight: `'Non Responsive' (476) and 'Duplicate opportunity' (419) are ${f1(A.top2_loss_share)}% of all losses; ${A.lost_reason_null} lost deals have no reason. Duplicates aren't real losses: without them the win rate is 48.8% instead of ${f2(A.winrate)}%.`,
      rec: "Add a duplicate check in Salesforce, make Loss Reason mandatory, and set a follow-up cadence before a deal can be closed as 'Non Responsive'." },
    { q: "Is our open pipeline real?", data: "Opportunity (Closed, Amount, Expected Amount, Close Date, Created Date)", kpi: "Active Opportunities, Expected Pipeline Value",
      analysis: "Sum open Amount and probability-weighted Expected Amount; flag open deals whose Close Date has passed or that are over a year old.",
      insight: `${fmtUS(A.active)} open deals are worth ${usdM(A.open_amt)} unweighted but only ${usdM(A.pipe)} weighted. ${A.open_past_close} of them already have a Close Date in the past and ${A.open_older_1y} are more than a year old.`,
      rec: "Run a pipeline clean-up: every open deal past its close date gets a new date or is closed. Report weighted pipeline, not raw Amount." },
    { q: "Where does won revenue come from?", data: "Opportunity, Account (Industry, Account Name)", kpi: "Total Won Revenue, Avg Deal Size, deal-size bands",
      analysis: "Band won deals by size, rank accounts and industries by won revenue.",
      insight: `Just ${A.enterprise_n} Enterprise deals (>$200K) bring ${f1(A.enterprise_share)}% of the ${usdM(A.won_rev)} won revenue. Federal Resources alone is $31.52M. Military is the top revenue industry ($40.82M) despite a 27.3% win rate.`,
      rec: "Treat Enterprise deals as a separate motion with executive sponsorship and a dedicated forecast, and protect the top accounts with account plans." },
    { q: "Why did won revenue fall in 2021?", data: "Opportunity (Close Date, Won, Amount)", kpi: "Won Revenue, # won deals, Avg Deal Size, Win Rate by year",
      analysis: "Decompose the year-on-year change into number of deals, average deal size and win rate.",
      insight: "Won revenue went from $45.48M (2020) to $41.49M (2021), −8.8%. Won deals fell 445 → 294 while average deal size rose $102K → $142K and win rate improved 42.0% → 45.9%. Closed deals dropped from 1,059 to 640.",
      rec: "The sales team isn't closing worse; fewer deals reach a decision. Focus on pipeline generation and moving stuck deals to a close." },
    { q: "Do converted leads close as well as other opportunities?", data: "Opportunity (Created by Lead Conversion, Won, Closed)", kpi: "Win Rate split by origin",
      analysis: "Compare win rate for opportunities created by lead conversion vs created directly by sales.",
      insight: `Opportunities from lead conversion win ${f1(A.wr_from_lead)}% of the time vs ${f1(A.wr_direct)}% for those created directly by sales.`,
      rec: "Raise the qualification bar before conversion (e.g. require MQL→SQL), so reps spend time on leads that can actually close." },
    { q: "Which industries should sales focus on?", data: "Opportunity (Industry, Won, Closed, Amount)", kpi: "Win Rate by industry, Won Revenue by industry",
      analysis: "Win rate per industry (80+ closed deals) next to won revenue.",
      insight: "State and Local (52.9%), Biopharma/Pharma (50.3%) and International (50.2%) win most often; Biotechnology (21.5%) and Communications (20.8%) least. 321 opportunities have no industry.",
      rec: "Prioritise high-win industries for new pipeline, review the Biotech and Communications sales approach, and fill the missing industry values." },
    { q: "Who are our best reps: by revenue or by win rate?", data: "Opportunity (Owner ID), User (Full Name)", kpi: "Won Revenue and Win Rate by owner",
      analysis: "Rank owners by won revenue and, separately, by win rate (50+ closed deals).",
      insight: "Jonathan Patterson leads revenue ($38.9M), followed by Liam Smith ($24.18M). By win rate, Benjamin Young (74.8%) and Lucas Lee (64.9%) lead. The top-revenue rep isn't the best closer.",
      rec: "Use both views in reviews: revenue for target attainment, win rate for coaching and sharing best practice." },
  ];
}

/* ---------------- TOOLS / DOMAIN / FLOW / TIMELINE / RULES (original) ---------------- */
const TOOLS = M_TOOLS;
const DOMAIN_WHAT = M_DOMAIN_WHAT;
const DOMAIN_WHERE = M_DOMAIN_WHERE;
const DOMAIN_DATA_TYPES = M_DOMAIN_DATA_TYPES;
const FLOW = M_FLOW;
const TIMELINE = M_TIMELINE;
const RULES = M_RULES;
const FOCUS_AREAS = M_FOCUS_AREAS;
const SOCIAL = M_SOCIAL;

/* ---------------- SETUP & DOWNLOADS ---------------- */
const SETUP_STEPS = [
  { i: "⬇️", t: "Get the dataset", d: "Your trainer shares the 5 Salesforce exports (Account, Lead, Opportunity, Opportunity Product, User) as CSV/XLSX." },
  { i: "❄️", t: "Load into Snowflake", d: "Create RAW, STG and MART schemas, COPY INTO the raw tables, then build staging tables and mart views." },
  { i: "✅", t: "Verify the load", d: "Row counts must match the Dataset page exactly (Lead 10,000; Opportunity 4,646; Account 3,052)." },
  { i: "📊", t: "Connect BI tools", d: "Point Tableau and Power BI at the Snowflake mart views, not at the CSV files." },
];
const SOFTWARE_LINKS = M_SOFTWARE_LINKS;
const DOCUMENTS = M_DOCUMENTS.concat([
  { name: "Lead.xlsx / Opportunity.xlsx / Account.xlsx", desc: "The source Salesforce exports (also Opportunity_Product.xlsx and User_Table.xlsx) — load these into Snowflake RAW.", icon: "🗂️", type: "download", href: "assets/docs/Opportunity.xlsx", filename: "Opportunity.xlsx" },
]);

/* ---------------- DATASET PAGE ---------------- */
const COVERAGE_TEXT = "Leads were created between Jul-2013 and Dec-2021, but 89% fall in 2020–2021 (2020: 3,765 · 2021: 5,156). Opportunities were created 2013–2021 and close between 2011 and 2030 (a few far-future close dates are data-entry errors). Snapshot / as-of date for ageing KPIs: 31-Dec-2021. Dates in the export are M/D/YYYY. Amounts are USD, stored as text like '$54,805.00' in the CSV. The Deleted column exists in every table but is FALSE on every row of this export.";
const STORY = [
  ["2020 → 2021", "Fewer, bigger deals", "Won deals fell 445 → 294 while average deal size rose $102K → $142K", "Won revenue by year, avg deal size trend"],
  ["Every year", "Enterprise concentration", "59 deals over $200K = 64.6% of all won revenue", "Deal-size band chart"],
  ["2021 Q2", "Lead spike", "3,832 leads in one quarter, converting at only 3.2%", "Leads by quarter vs conversion %"],
  ["Always", "Stale pipeline", "772 open deals already past their close date", "Pipeline ageing, close-date filter"],
  ["Always", "Losses that aren't losses", "419 deals closed lost as 'Duplicate opportunity'", "Loss reason bar"],
];

/* ---------------- DATA MODEL ---------------- */
const TABLE_TYPES = { "fact_lead": "Fact", "fact_opportunity": "Fact", "fact_opp_product": "Fact", "dim_account": "Dimension", "dim_user": "Dimension" };
const TABLE_SRC = { "fact_lead": "Lead", "fact_opportunity": "Opportunity", "fact_opp_product": "Opportunity Product", "dim_account": "Account", "dim_user": "User" };
const TABLE_PK = { "fact_lead": "lead_id", "fact_opportunity": "opportunity_id", "fact_opp_product": "line_item_id", "dim_account": "account_id", "dim_user": "user_id" };
const TABLE_FK = { "fact_lead": "conv_account_id, conv_opp_id (only when converted)", "fact_opportunity": "account_id, owner_id", "fact_opp_product": "opportunity_id" };
const TABLE_GRAIN = { "fact_lead": "1 row per lead", "fact_opportunity": "1 row per opportunity (deal)", "fact_opp_product": "1 row per product line on a deal", "dim_account": "1 row per account", "dim_user": "1 row per Salesforce user" };
const TABLE_DATE = { "fact_lead": "Created_Date", "fact_opportunity": "Created_Date, Close_Date", "fact_opp_product": "Created_Date" };
const TABLE_PURPOSE = {
  "fact_lead": ["Every lead marketing captured, with source, status, score and conversion links.", "The whole Lead Analytics dashboard is built here: volume, conversion and source quality."],
  "fact_opportunity": ["Every deal with stage, amount, probability, close date, owner and loss reason.", "The Opportunity Performance dashboard: win rate, revenue, pipeline and loss analysis."],
  "fact_opp_product": ["The products on each deal, with quantity, price and total.", "Needed for product-level revenue. Its grain is lower than the opportunity, so never sum Opportunity Amount after joining it."],
  "dim_account": ["The customer companies, with industry, type and billing location.", "Lets you slice deals and converted leads by industry and account."],
  "dim_user": ["The 98 Salesforce users (sales reps, owners).", "Rep performance views and row-level security both hang off this table."],
};
const RELATIONSHIPS = M_RELATIONSHIPS;
const LOAD_ORDER = M_LOAD_ORDER;
const CALC_FIELDS = M_CALC_FIELDS.map(x => x.startsWith("Age_Days") ? "Age_Days — DATEDIFF(day, Created_Date, '2021-12-31') (open leads only; a fixed as-of date keeps the KPI reproducible)" : x).concat(["Days_to_Close_Valid — flag Days_to_Close < 0 (244 won deals) so averages can exclude them"]);
const GOTCHAS = [
  { t: "Win Rate denominator = closed deals only", d: `1,443 won ÷ (1,443 won + 1,931 lost) = ${f2(A.winrate)}%. Dividing by all 4,646 opportunities gives 31.06%, which is Opportunity Conversion Rate, a different KPI.` },
  { t: "Don't sum Opportunity Amount after joining line items", d: "For the 1,207 won deals with products, the real revenue is $108.73M; joined to 2,900 line items, SUM(Amount) shows $336.72M. Use Total Price for product views, Amount for deal views." },
  { t: "Use the Converted flag, not Status", d: "Converted = TRUE on 1,033 leads, but Status = 'Converted' on only 907. Status (Simplified) is 'Open' on all 10,000 rows, so it's useless as a filter." },
  { t: "Converted Opportunities needs DISTINCT", d: "411 converted leads point to only 375 distinct opportunities, because several leads merge into the same deal." },
  { t: "Amount is text in the CSV", d: "'$54,805.00' must become 54805.00 with REPLACE + CAST in staging. 474 Amounts are blank: keep them NULL, don't turn them into $0." },
  { t: "Two dates on every opportunity", d: "Created Date for pipeline-created trends, Close Date for revenue and win rate. In Power BI one relationship is active, the other used via USERELATIONSHIP." },
  { t: "Inner joins drop 123 deals", d: "123 opportunities reference an Account ID that isn't in the Account export. Use LEFT joins and an 'Unknown account' member." },
  { t: "Negative and far-future dates", d: "244 won deals close before they were created; 13 deals close after 2022 (one in 2030). Flag them; exclude negatives from Avg Days to Close." },
];
const GLOBAL_FILTERS = M_GLOBAL_FILTERS;
const DASHBOARDS = M_DASHBOARDS;

/* ---------------- DATA QUALITY ---------------- */
const NULL_NOTES = [
  "The Deleted column exists in every export but is FALSE on all rows of this dataset (Account 3,052, Opportunity 4,646, Opportunity Product 10,000). Keep the WHERE Deleted = FALSE filter as a standing rule for future refreshes, but it removes nothing today.",
].concat(M_NULL_NOTES.slice(1)).concat([
  "474 of 4,646 opportunities have a blank Amount (14 of them Closed Won) and 624 have a blank Expected Amount. Keep them NULL and report the count; NULL is not $0.",
  "123 opportunities reference an Account ID that does not exist in the Account export (orphans). An inner join silently drops them from every total.",
  "244 Closed Won deals have a Close Date before their Created Date (negative Days to Close). 13 deals close after 2022, the latest in 2030, and 7 close in 2011.",
  "Lead.Status = 'Converted' on 907 rows but the Converted flag is TRUE on 1,033. Use the flag. 411 converted leads point to 375 distinct opportunities.",
  "The Region column is empty in both Account and Lead. Billing Country is filled but inconsistent ('UNITED STATES', 'United States', 'USA'), so standardise it before any geographic view.",
  "Opportunity Type is blank on 4,555 of 4,646 opportunities, so 'Expected Amount by Opportunity Type' is mostly 'Unspecified': say so on the visual.",
  "Lead and opportunity dates are exported as M/D/YYYY text. Parse them explicitly (TO_TIMESTAMP with a format) or 4/5/2021 may become 4-May.",
]);
const DQ_RULES = [
  ["Row counts", "COUNT(*) per table matches the Dataset page", "All 5 tables", "Critical"],
  ["Primary keys unique", "No duplicate Lead ID, Opportunity ID, Account ID, Line Item ID", "All tables", "Critical"],
  ["Referential integrity", "Every Opportunity.Account ID and Owner ID finds its dimension row (123 account orphans today)", "fact_opportunity", "Critical"],
  ["Amount cleaning", "Amount / Expected Amount / prices stripped of '$' and ',' and cast to NUMBER; blanks stay NULL", "Opportunity, Opp Product", "Critical"],
  ["Stage mapping", "All 12 raw Stage values map to a Stage_Group with zero NULLs", "fact_opportunity", "High"],
  ["Won / Closed logic", "Won = TRUE ⇒ Closed = TRUE; Probability = 100 for won, 0 for lost", "fact_opportunity", "High"],
  ["Expected Amount", "Expected Amount = Amount × Probability / 100 (0 mismatches expected)", "fact_opportunity", "Medium"],
  ["Date logic", "Close Date ≥ Created Date; close dates within a sensible range", "fact_opportunity", "High"],
  ["Conversion links", "Converted leads have Converted Opportunity / Account IDs that exist", "fact_lead", "High"],
  ["Deleted filter", "Deleted = FALSE applied in staging (0 rows removed in this export)", "All tables", "Medium"],
];

/* ---------------- INTERVIEW TRAPS ---------------- */
const INTERVIEW_TRAPS = [
  ["Win Rate = Won ÷ All opportunities", "Won ÷ (Won + Lost): closed deals only, 42.77% not 31.06%"],
  ["Join Opportunity to line items, then SUM(Amount)", "Keep each fact at its grain; $336.72M vs the true $108.73M"],
  ["Lead conversion from Status = 'Converted'", "Use the Converted flag: 1,033 not 907"],
  ["COUNT converted opportunity IDs", "COUNT DISTINCT: 375, not 411"],
  ["Replace blank Amount with 0", "Keep NULL, find out why, report the count"],
  ["One date for every chart", "Created Date for pipeline created, Close Date for revenue"],
  ["Salesforce permissions apply in Power BI", "Design and test Power BI RLS separately"],
  ["Reports connector is fine for full data", "Salesforce Reports caps at 2,000 rows: use Objects or a warehouse"],
];
const PRESENTATION = [
  ["01", "Business Problem", "30 sec", "CRM data in silos; marketing and sales report different numbers."],
  ["02", "Dataset", "30 sec", "5 Salesforce exports: 10,000 leads, 4,646 opportunities, 3,052 accounts, 98 users."],
  ["03", "Architecture & Model", "45 sec", "Snowflake Raw → Staging → Mart; facts at lead, deal and line-item grain."],
  ["04", "KPIs", "45 sec", "The 8 P1 KPIs and the Win Rate / line-item / conversion traps."],
  ["05", "Dashboards", "90 sec", "Walk through Lead Analytics and Opportunity Performance live."],
  ["06", "Insights", "45 sec", "10.3% lead conversion, 42.8% win rate, 46% of losses are no-response or duplicates, 59 deals = 65% of revenue."],
  ["07", "Recommendations", "30 sec", "Lead-source budget shift, duplicate control, pipeline clean-up, enterprise deal motion."],
];
/* ---------------- SQL LAB (Snowflake) ---------------- */
const SQL_BLOCKS = [
  { cat: "Setup", title: "1 · Database, schemas and COPY INTO (raw layer)", desc: "Raw keeps the export exactly as it came: every column as text. Cleaning happens in staging.",
    sql: "CREATE DATABASE IF NOT EXISTS AXON_CRM;\nCREATE SCHEMA IF NOT EXISTS AXON_CRM.RAW;\nCREATE SCHEMA IF NOT EXISTS AXON_CRM.STG;\nCREATE SCHEMA IF NOT EXISTS AXON_CRM.MART;\n\nCREATE OR REPLACE FILE FORMAT AXON_CRM.RAW.csv_ff\n  TYPE = CSV  SKIP_HEADER = 1  FIELD_OPTIONALLY_ENCLOSED_BY = '\"'\n  NULL_IF = ('', 'NULL')  EMPTY_FIELD_AS_NULL = TRUE;\n\nCREATE OR REPLACE STAGE AXON_CRM.RAW.crm_stage FILE_FORMAT = AXON_CRM.RAW.csv_ff;\n-- PUT file://Oppertuninty_Table.csv @AXON_CRM.RAW.crm_stage;   (SnowSQL)\n\nCOPY INTO AXON_CRM.RAW.opportunity\nFROM @AXON_CRM.RAW.crm_stage/Oppertuninty_Table.csv\nON_ERROR = 'ABORT_STATEMENT';\n-- repeat for account, lead, opp_product, user" },
  { cat: "Setup", title: "2 · Verify the load: row counts", desc: "Every count must match before you build anything.",
    sql: "SELECT 'account' t, COUNT(*) FROM RAW.account            -- 3,052\nUNION ALL SELECT 'lead', COUNT(*) FROM RAW.lead              -- 10,000\nUNION ALL SELECT 'opportunity', COUNT(*) FROM RAW.opportunity -- 4,646\nUNION ALL SELECT 'opp_product', COUNT(*) FROM RAW.opp_product -- 10,000\nUNION ALL SELECT 'user', COUNT(*) FROM RAW.\"USER\";           -- 98\n\nSELECT COUNT(*) FROM RAW.opportunity WHERE \"Deleted\" = 'True';  -- 0 in this export (keep the filter anyway)" },
  { cat: "Setup", title: "3 · Staging: clean fact_opportunity", desc: "Strip '$' and commas from Amount, parse M/D/YYYY dates, derive Stage_Group and Days_to_Close.",
    sql: "CREATE OR REPLACE TABLE STG.fact_opportunity AS\nSELECT\n  \"Opportunity ID\"                                         AS opportunity_id,\n  \"Account ID\"                                             AS account_id,\n  \"Owner ID\"                                               AS owner_id,\n  \"Stage\"                                                  AS stage,\n  TRY_TO_NUMBER(REPLACE(REPLACE(\"Amount\", '$', ''), ',', ''), 18, 2)          AS amount,\n  TRY_TO_NUMBER(REPLACE(REPLACE(\"Expected Amount\", '$', ''), ',', ''), 18, 2) AS expected_amount,\n  TRY_TO_NUMBER(\"Probability (%)\")                         AS probability,\n  \"Won\"    = 'True'                                        AS won,\n  \"Closed\" = 'True'                                        AS closed,\n  TO_TIMESTAMP(\"Created Date\", 'MM/DD/YYYY HH24:MI')      AS created_date,\n  TO_DATE(\"Close Date\", 'MM/DD/YYYY')                     AS close_date,\n  DATEDIFF(day, TO_TIMESTAMP(\"Created Date\", 'MM/DD/YYYY HH24:MI'), TO_DATE(\"Close Date\", 'MM/DD/YYYY')) AS days_to_close,\n  \"Closed Lost Reason\"                                     AS closed_lost_reason,\n  \"Lead Source\"                                            AS lead_source,\n  \"Industry\"                                               AS industry,\n  \"Created by Lead Conversion\" = 'True'                    AS created_by_lead_conversion,\n  CASE\n    WHEN \"Stage\" = 'Closed Won'  THEN 'Won'\n    WHEN \"Stage\" = 'Closed Lost' THEN 'Lost'\n    WHEN \"Stage\" IN ('Funnel', 'Quoted Funnel')                     THEN 'New'\n    WHEN \"Stage\" IN ('Qualified Opportunity', 'Upside',\n                     'Customer Assessment w/ Favorable Evaluation') THEN 'Qualified'\n    ELSE 'Late-Stage'\n  END                                                      AS stage_group\nFROM RAW.opportunity\nWHERE COALESCE(\"Deleted\", 'False') = 'False';\n\nSELECT COUNT(*), COUNT(amount) FROM STG.fact_opportunity;   -- 4,646 rows · 4,172 with an Amount" },
  { cat: "Setup", title: "4 · Mart view for BI: vw_opp_summary", desc: "LEFT joins, so the 123 opportunities with an unknown Account ID stay in every total.",
    sql: "CREATE OR REPLACE VIEW MART.vw_opp_summary AS\nSELECT o.*,\n       COALESCE(a.account_name, 'Unknown account') AS account_name,\n       COALESCE(a.industry, o.industry, 'Unknown') AS account_industry,\n       u.full_name                                  AS owner_name\nFROM STG.fact_opportunity o\nLEFT JOIN STG.dim_account a ON a.account_id = o.account_id\nLEFT JOIN STG.dim_user    u ON u.user_id    = o.owner_id;\n\nSELECT COUNT(*) FROM MART.vw_opp_summary;   -- must stay 4,646 (an INNER JOIN would return 4,523)" },
  { cat: "KPI", title: "5 · Lead KPIs: conversion rate, converted accounts and opportunities", desc: "Use the Converted flag, and COUNT DISTINCT the conversion IDs.",
    sql: "SELECT COUNT(*)                                       AS total_leads,           -- 10,000\n       COUNT_IF(is_converted)                         AS converted_leads,       -- 1,033\n       ROUND(COUNT_IF(is_converted) * 100.0 / COUNT(*), 2) AS conversion_pct,    -- 10.33\n       COUNT(DISTINCT conv_account_id)                AS converted_accounts,    -- 699\n       COUNT(DISTINCT conv_opp_id)                    AS converted_opps,        -- 375\n       COUNT(conv_opp_id)                             AS conv_opp_rows          -- 411 (not the KPI!)\nFROM STG.fact_lead;" },
  { cat: "KPI", title: "6 · Win Rate, Loss Rate and Opportunity Conversion Rate", desc: "Win and loss rates divide by CLOSED deals; opportunity conversion divides by ALL deals.",
    sql: "SELECT\n  COUNT_IF(won)                                                     AS won,        -- 1,443\n  COUNT_IF(closed AND NOT won)                                      AS lost,       -- 1,931\n  COUNT_IF(NOT closed)                                              AS open_opps,  -- 1,272\n  ROUND(COUNT_IF(won) * 100.0 / NULLIF(COUNT_IF(closed), 0), 2)     AS win_rate,   -- 42.77\n  ROUND(COUNT_IF(closed AND NOT won) * 100.0 / NULLIF(COUNT_IF(closed), 0), 2) AS loss_rate, -- 57.23\n  ROUND(COUNT_IF(won) * 100.0 / COUNT(*), 2)                        AS opp_conversion -- 31.06\nFROM STG.fact_opportunity;" },
  { cat: "KPI", title: "7 · Won revenue, average deal size, expected pipeline", desc: "Expected pipeline = SUM(Expected Amount) of open deals, i.e. Amount × Probability.",
    sql: "SELECT\n  SUM(IFF(won, amount, NULL))                   AS won_revenue,        -- 136,260,611.73\n  ROUND(AVG(IFF(won, amount, NULL)), 2)         AS avg_deal_size,      -- 95,353.82 (blank amounts excluded)\n  SUM(IFF(NOT closed, expected_amount, NULL))   AS expected_pipeline,  -- 47,883,357.24\n  SUM(IFF(NOT closed, amount, NULL))            AS open_amount_raw,    -- 247,484,943.74 (unweighted)\n  ROUND(AVG(IFF(won AND days_to_close >= 0, days_to_close, NULL)), 1) AS avg_days_to_close_valid  -- 124.4\nFROM STG.fact_opportunity;" },
  { cat: "Trap", title: "8 · The line-item duplication trap, with real numbers", desc: "Joining deals to their products repeats Amount on every line. Compare the three totals.",
    sql: "-- Won deals that have line items\nWITH won_with_lines AS (\n  SELECT * FROM STG.fact_opportunity o\n  WHERE won AND EXISTS (SELECT 1 FROM STG.fact_opp_product p WHERE p.opportunity_id = o.opportunity_id)\n)\nSELECT\n  (SELECT SUM(amount) FROM won_with_lines)                               AS correct_deal_revenue,   -- 108,728,915.19\n  (SELECT SUM(w.amount) FROM won_with_lines w\n     JOIN STG.fact_opp_product p ON p.opportunity_id = w.opportunity_id) AS wrong_joined_sum,       -- 336,724,071.45 (3.1x)\n  (SELECT SUM(p.total_price) FROM won_with_lines w\n     JOIN STG.fact_opp_product p ON p.opportunity_id = w.opportunity_id) AS product_line_revenue;  -- 107,487,460.45" },
  { cat: "Breakdown", title: "9 · Lead conversion by source", desc: "Volume and quality side by side; sources with 100+ leads only.",
    sql: "SELECT lead_source,\n       COUNT(*)                                          AS leads,\n       ROUND(COUNT_IF(is_converted) * 100.0 / COUNT(*), 1) AS conversion_pct\nFROM STG.fact_lead\nGROUP BY lead_source\nHAVING COUNT(*) >= 100\nORDER BY conversion_pct DESC;   -- Field Sales 28.2 · Website 23.1 · ... · Inside Sales 1.3 (2,786 leads)" },
  { cat: "Breakdown", title: "10 · Loss reasons, and win rate without duplicates", desc: "419 'Duplicate opportunity' losses aren't real losses.",
    sql: "SELECT COALESCE(closed_lost_reason, '(blank)') AS reason, COUNT(*) AS lost_deals\nFROM STG.fact_opportunity\nWHERE closed AND NOT won\nGROUP BY 1 ORDER BY 2 DESC;   -- Non Responsive 476 · Duplicate opportunity 419 · Other 315 · (blank) 293 ...\n\nSELECT ROUND(COUNT_IF(won) * 100.0 /\n       COUNT_IF(closed AND COALESCE(closed_lost_reason, '') <> 'Duplicate opportunity'), 1) AS win_rate_excl_dupes  -- 48.8\nFROM STG.fact_opportunity;" },
  { cat: "Breakdown", title: "11 · Rep leaderboard with window functions", desc: "Revenue rank and win-rate rank for every owner with 50+ closed deals.",
    sql: "WITH rep AS (\n  SELECT owner_name,\n         SUM(IFF(won, amount, 0))                  AS won_revenue,\n         COUNT_IF(closed)                          AS closed_deals,\n         COUNT_IF(won) * 100.0 / NULLIF(COUNT_IF(closed), 0) AS win_rate\n  FROM MART.vw_opp_summary\n  GROUP BY owner_name\n)\nSELECT owner_name, ROUND(won_revenue / 1e6, 2) AS won_rev_m, ROUND(win_rate, 1) AS win_rate,\n       RANK() OVER (ORDER BY won_revenue DESC) AS revenue_rank,\n       RANK() OVER (ORDER BY win_rate DESC)    AS win_rate_rank\nFROM rep WHERE closed_deals >= 50\nORDER BY revenue_rank;   -- Jonathan Patterson 38.90 first by revenue; Benjamin Young 74.8% first by win rate" },
  { cat: "Breakdown", title: "12 · Why did 2021 revenue fall? (decomposition)", desc: "Revenue = number of won deals × average deal size. Check both, and the win rate.",
    sql: "SELECT YEAR(close_date)                                   AS close_year,\n       COUNT_IF(won)                                      AS won_deals,       -- 2020: 445 · 2021: 294\n       ROUND(SUM(IFF(won, amount, 0)) / 1e6, 2)           AS won_rev_m,       -- 45.48 · 41.49\n       ROUND(AVG(IFF(won, amount, NULL)), 0)              AS avg_deal,        -- 102,212 · 141,597\n       ROUND(COUNT_IF(won) * 100.0 / COUNT_IF(closed), 1) AS win_rate,        -- 42.0 · 45.9\n       COUNT_IF(closed)                                   AS closed_deals     -- 1,059 · 640\nFROM STG.fact_opportunity\nWHERE YEAR(close_date) IN (2020, 2021)\nGROUP BY 1 ORDER BY 1;" },
  { cat: "Breakdown", title: "13 · Monthly win-rate trend (Closed Won vs Total Closed)", desc: "Trend by Close Date, closed deals only in the denominator.",
    sql: "SELECT DATE_TRUNC('month', close_date)                 AS close_month,\n       COUNT_IF(won)                                     AS won,\n       COUNT_IF(closed)                                  AS closed,\n       ROUND(COUNT_IF(won) * 100.0 / NULLIF(COUNT_IF(closed), 0), 1) AS win_rate\nFROM STG.fact_opportunity\nWHERE close_date BETWEEN '2020-01-01' AND '2021-12-31'\nGROUP BY 1 ORDER BY 1;" },
];

const QA_SQL = [
  { title: "QA 1 · Data count validation", desc: "Raw, staging and mart counts must agree (no rows lost in a join).",
    sql: "SELECT (SELECT COUNT(*) FROM RAW.opportunity)       AS raw_opps,   -- 4,646\n       (SELECT COUNT(*) FROM STG.fact_opportunity)  AS stg_opps,   -- 4,646\n       (SELECT COUNT(*) FROM MART.vw_opp_summary)   AS mart_opps;  -- 4,646 (LEFT joins)" },
  { title: "QA 2 · Completeness: blanks in key columns", desc: "Report these counts in the Data Quality Log; don't silently fill them.",
    sql: "SELECT COUNT_IF(amount IS NULL)           AS blank_amount,     -- 474\n       COUNT_IF(won AND amount IS NULL)    AS blank_won_amount, -- 14\n       COUNT_IF(expected_amount IS NULL)   AS blank_expected,   -- 624\n       COUNT_IF(stage_group IS NULL)       AS unmapped_stage,   -- 0\n       COUNT_IF(industry IS NULL)          AS blank_industry    -- 321\nFROM STG.fact_opportunity;" },
  { title: "QA 3 · Consistency: orphans and impossible dates", desc: "The original checklist expected 0 orphans; this export actually has 123.",
    sql: "SELECT COUNT(*) FROM STG.fact_opportunity o\nLEFT JOIN STG.dim_account a ON a.account_id = o.account_id\nWHERE a.account_id IS NULL;                          -- 123 (log them, keep them via LEFT JOIN)\n\nSELECT COUNT(*) FROM STG.fact_opportunity o\nLEFT JOIN STG.dim_user u ON u.user_id = o.owner_id\nWHERE u.user_id IS NULL;                             -- 0\n\nSELECT COUNT_IF(won AND days_to_close < 0)  AS won_closed_before_created,  -- 244\n       COUNT_IF(close_date > '2022-12-31')  AS close_after_2022            -- 13\nFROM STG.fact_opportunity;" },
  { title: "QA 4 · Duplicates at each grain", desc: "All three should return 0 rows.",
    sql: "SELECT opportunity_id, COUNT(*) FROM STG.fact_opportunity GROUP BY 1 HAVING COUNT(*) > 1;\nSELECT lead_id, COUNT(*)        FROM STG.fact_lead        GROUP BY 1 HAVING COUNT(*) > 1;\nSELECT line_item_id, COUNT(*)   FROM STG.fact_opp_product GROUP BY 1 HAVING COUNT(*) > 1;" },
  { title: "QA 5 · Dashboard aggregation check (fixed)", desc: "The original query defined 'closed' as Won OR Closed_Lost_Reason IS NOT NULL, which returns 46.76%. Use the Closed flag.",
    sql: "SELECT COUNT_IF(is_converted) FROM STG.fact_lead;                         -- Converted Leads = 1,033\nSELECT ROUND(COUNT_IF(is_converted) * 100.0 / COUNT(*), 2) FROM STG.fact_lead;   -- 10.33\nSELECT SUM(amount) FROM STG.fact_opportunity WHERE won;                     -- 136,260,611.73\nSELECT ROUND(COUNT_IF(won) * 100.0 / COUNT_IF(closed), 2) FROM STG.fact_opportunity;  -- 42.77 ✓\n-- ✗ old version: ... / COUNT_IF(won OR closed_lost_reason IS NOT NULL) → 46.76 (293 lost deals have no reason)\nSELECT SUM(expected_amount) FROM STG.fact_opportunity WHERE NOT closed;    -- 47,883,357.24" },
  { title: "QA 6 · Performance check", desc: "Mart queries should finish well under the BRD's 10-second target on an X-Small warehouse.",
    sql: "ALTER WAREHOUSE COMPUTE_WH SET WAREHOUSE_SIZE = 'XSMALL' AUTO_SUSPEND = 300 AUTO_RESUME = TRUE;\nSELECT * FROM MART.vw_opp_summary WHERE close_date BETWEEN '2020-01-01' AND '2021-12-31';\n-- then check Query Profile / QUERY_HISTORY for total elapsed time" },
];

const QA_CHECKLIST = [
  { id: "q1", t: "Row counts match", d: "Raw = staging = mart for every table (Opportunity 4,646 everywhere)." },
  { id: "q2", t: "Amount cleaned", d: "No '$' or ',' left; blanks stay NULL (474), not $0." },
  { id: "q3", t: "Win Rate uses closed deals", d: "42.77% in SQL, Tableau and Power BI (not 31.06% or 46.76%)." },
  { id: "q4", t: "No line-item duplication", d: "Won revenue is $136.26M on the deal page, whatever product filters exist." },
  { id: "q5", t: "Right date per visual", d: "Created Date for pipeline-created trends, Close Date for revenue and win rate." },
  { id: "q6", t: "Conversion uses the flag", d: "Converted Leads = 1,033; Converted Opportunities = 375 (distinct)." },
  { id: "q7", t: "Filters behave", d: "Industry, source, owner and stage slicers change every visual consistently." },
  { id: "q8", t: "Definitions documented", d: "Each KPI card links back to its KPI Library definition." },
];

/* ---------------- EXCEL ---------------- */
const EXCEL_TASKS = [
  ["Clean Amount", "=VALUE(SUBSTITUTE(SUBSTITUTE(Amount,\"$\",\"\"),\",\",\"\"))", "No text left in Amount", "Starter ✓"],
  ["Lead conversion rate", "=COUNTIFS(Converted,TRUE)/COUNTA(Lead_ID)", "10.33%", "Starter ✓"],
  ["Win rate", "=COUNTIFS(Won,TRUE)/COUNTIFS(Closed,TRUE)", "42.77%", "Starter ✓"],
  ["Opportunity conversion", "=COUNTIFS(Won,TRUE)/COUNTA(Opportunity_ID)", "31.06%", "Starter ✓"],
  ["Expected pipeline", "=SUMIFS(Expected_Amount, Closed, FALSE)", "$47.88M", "Starter ✓"],
  ["Won revenue", "=SUMIFS(Amount_Clean, Won, TRUE)", "$136.26M", "Your task"],
  ["Days to close", "=DATEVALUE(Close_Date) - INT(Created_Date)", "244 negatives to flag", "Your task"],
  ["Stage group", "=IFS(Stage=\"Closed Won\",\"Won\",Stage=\"Closed Lost\",\"Lost\",TRUE,\"Open\")", "1,443 / 1,931 / 1,272", "Your task"],
  ["Owner name lookup", "=XLOOKUP(Owner_ID, User[User ID], User[Full Name])", "98 users", "Your task"],
  ["Converted opps (distinct)", "=COUNTA(UNIQUE(FILTER(Conv_Opp_ID, Conv_Opp_ID<>\"\")))", "375", "Your task"],
];
const PIVOTS = [
  { n: "01", h: "Leads and conversion by source", p: "Rows: Lead Source · Values: Count of Lead ID, Sum of Converted (as 1/0) · add Converted ÷ Count. Inside Sales: big volume, 1.3% conversion." },
  { n: "02", h: "Pipeline by stage", p: "Rows: Stage · Values: Count of Opportunity ID, Sum of Amount, Sum of Expected Amount · filter Closed = FALSE." },
  { n: "03", h: "Loss reasons", p: "Rows: Closed Lost Reason · Values: Count · filter Closed = TRUE, Won = FALSE. Include (blank): 293 deals." },
  { n: "04", h: "Won revenue by close year", p: "Rows: Close Date grouped by Year · Values: Sum of Amount (won only), Count. Compare 2020 vs 2021." },
  { n: "05", h: "Win rate by industry", p: "Rows: Industry · Columns: Won · Values: Count, filter Closed = TRUE, show as % of row total." },
];

/* ---------------- DASHBOARD GALLERY ---------------- */
function galleryPages() {
  const m = MD, a = A;
  return [
    { n: "01", t: "Lead Analytics — Funnel Overview", q: "How many leads do we get, and how many become customers?", ins: `${fmtUS(a.leads)} leads, ${fmtUS(a.conv)} converted (${f2(a.convrate)}%), creating ${a.conv_opp} opportunities worth ${usdM(a.exp_rev_conv)}.`, iq: "Why use the Converted flag instead of Lead Status?", aud: "Marketing · Sales management", keys: ["Total Leads", "Converted", "Conversion %", "Expected Rev"],
      desc: "Dashboard 1, main page: lead volume, conversion and the value marketing hands to sales.",
      mock: { title: "Lead Analytics — Funnel Overview", sub: "fact_lead, 10,000 leads (as of 31-Dec-2021)",
        kpis: [{ v: fmtUS(a.leads), l: "Total leads" }, { v: fmtUS(a.conv), l: "Converted leads" }, { v: f2(a.convrate) + "%", l: "Conversion rate" }, { v: fmtUS(a.conv_acc), l: "Converted accounts" }, { v: fmtUS(a.conv_opp), l: "Converted opportunities" }, { v: usdM(a.exp_rev_conv), l: "Expected revenue (converted)" }],
        donuts: [{ title: "Leads by source (top 8)", data: m.lead_source }],
        bars: [{ title: "Leads by quarter (2020–2021)", data: m.leads_q }, { title: "Conversion % by quarter", data: m.conv_q, suffix: "%" }, { title: "Lead status mix", data: m.lead_status }, { title: "Leads by industry", data: m.lead_industry }] },
      build: { tableau: ["Live connection to MART.vw_lead_funnel", "Conversion % = SUM([Is Converted]) / COUNT([Lead Id])", "Dual axis: leads (bars) and conversion % (line) by quarter"],
               powerbi: ["Measures from the KPI Library; Converted Opportunities uses DISTINCTCOUNTNOBLANK", "Date table related to fact_lead[Created_Date]", "KPI cards with prior-period comparison"] } },
    { n: "02", t: "Lead Source & Quality", q: "Which lead sources should marketing invest in?", ins: `Inside Sales has the most leads (${fmtUS(a.inside_n)}) but converts ${f1(a.inside_conv)}%; Field Sales converts 28.2%, Website 23.1%.`, iq: "How would you compare lead sources fairly?", aud: "Marketing", keys: ["Source", "Conversion %", "Lead Score", "Status"],
      desc: "Dashboard 1, drill-through page: lead quality by source, status and score coverage.",
      mock: { title: "Lead Source & Quality", sub: "Sources with 100+ leads",
        kpis: [{ v: f1(a.inside_conv) + "%", l: "Inside Sales conversion" }, { v: "28.2%", l: "Field Sales conversion" }, { v: fmtUS(a.scored), l: "Leads with a score" }, { v: f2(a.avg_score), l: "Avg lead score (scored)" }],
        donuts: [{ title: "Lead status", data: m.lead_status }],
        bars: [{ title: "Conversion % by source", data: m.conv_by_source, suffix: "%" }, { title: "Leads by source", data: m.lead_source }, { title: "Leads by year created", data: m.lead_year }] },
      build: { tableau: ["Scatter: leads (x) vs conversion % (y) per source", "Highlight Inside Sales with an annotation", "Filter action from source to the lead list"],
               powerbi: ["Conversion % by source with a constant line at 10.33%", "Drill-through page filtered on Lead Source", "Card showing scored-lead coverage (603 of 10,000)"] } },
    { n: "03", t: "Opportunity Performance — Pipeline", q: "How much have we won, and what's still in play?", ins: `${usdM(a.won_rev)} won, win rate ${f2(a.winrate)}%, ${fmtUS(a.active)} open deals worth ${usdM(a.pipe)} weighted.`, iq: "Why is Win Rate divided by closed deals only?", aud: "Sales managers · Sales directors", keys: ["Won Revenue", "Win Rate", "Open Opps", "Expected Pipeline"],
      desc: "Dashboard 2, main page: revenue, win/loss and the weighted pipeline.",
      mock: { title: "Opportunity Performance — Pipeline", sub: "fact_opportunity, 4,646 deals",
        kpis: [{ v: usdM(a.won_rev), l: "Total won revenue" }, { v: f2(a.winrate) + "%", l: "Win rate" }, { v: f2(a.lossrate) + "%", l: "Loss rate" }, { v: fmtUS(a.active), l: "Active opportunities" }, { v: usdM(a.pipe), l: "Expected pipeline" }, { v: "$" + fmtUS(Math.round(a.avgdeal)), l: "Avg deal size (won)" }],
        donuts: [{ title: "Stage mix", data: m.stage }],
        bars: [{ title: "Won revenue by close year ($M)", data: m.won_rev_year_m }, { title: "Win rate % by close year", data: (m.winrate_year || []).filter(r => r[0] !== "2022"), suffix: "%" }, { title: "Weighted pipeline by stage ($M)", data: m.pipe_stage_m }, { title: "Top loss reasons", data: m.loss_reason }] },
      build: { tableau: ["Win Rate = COUNTD(IF [Won] THEN [Opportunity Id] END) / COUNTD(IF [Closed] THEN [Opportunity Id] END)", "Stage funnel sorted by a Stage_Group order field", "Global Industry filter applied to all worksheets"],
               powerbi: ["Close Date active relationship; Created Date via USERELATIONSHIP", "Expected Pipeline = SUM(Expected_Amount) for open deals", "Never put Opportunity Product columns on this page's revenue visuals"] } },
    { n: "04", t: "Win/Loss, Accounts & Reps", q: "Where do we win, who wins, and how concentrated is revenue?", ins: `${a.enterprise_n} Enterprise deals = ${f1(a.enterprise_share)}% of won revenue; Jonathan Patterson leads revenue, Benjamin Young leads win rate.`, iq: "Is the best-revenue rep the best closer?", aud: "Sales directors · Sales ops", keys: ["Win rate by industry", "Top accounts", "Reps", "Deal size"],
      desc: "Dashboard 2, drill-through page: win/loss by industry, deal-size concentration, top accounts and rep leaderboard.",
      mock: { title: "Win/Loss, Accounts & Reps", sub: "Closed deals; reps with 50+ closed deals for win rate",
        kpis: [{ v: f1(a.enterprise_share) + "%", l: "Revenue from 59 Enterprise deals" }, { v: "$31.52M", l: "Top account (Federal Resources)" }, { v: f1(a.wr_direct) + "%", l: "Win rate: direct opps" }, { v: f1(a.wr_from_lead) + "%", l: "Win rate: from leads" }],
        donuts: [{ title: "Won revenue by deal size ($M)", data: m.deal_bands_rev_m }],
        bars: [{ title: "Win rate % by industry", data: m.winrate_industry, suffix: "%" }, { title: "Top reps by won revenue ($M)", data: m.top_reps_m }, { title: "Rep win rate % (50+ closed)", data: m.rep_winrate, suffix: "%" }, { title: "Top accounts by won revenue ($M)", data: (m.top_accounts_m || []).slice(0, 4) }] },
      build: { tableau: ["Grouped bar: Won vs Lost by industry", "Deal_Size_Band calc as a dimension", "Top N parameter on accounts"],
               powerbi: ["RANKX for rep leaderboards", "Deal-size band as a calculated column", "Tooltip page with deal count per bar"] } },
  ];
}

/* ---------------- ASSIGNMENTS ---------------- */
function assignments() {
  const a = A;
  return [
    { id: "a1", tool: "Data Exploration · Excel or SQL", track: "business", t: "How many leads are converted?",
      task: ["Use the Lead export.", "Count rows where Converted = TRUE.", "Compare with Status = 'Converted'."], type: "num", ans: a.conv, tol: 0, unit: "leads",
      hint: "The Converted flag and the Status column disagree. Use the flag.", sol: "SELECT COUNT_IF(is_converted) FROM STG.fact_lead;   -- 1,033\n-- Status = 'Converted' gives only 907" },
    { id: "a2", tool: "SQL", track: "sql", t: "What is the Lead Conversion Rate %? (two decimals)",
      task: ["Converted leads ÷ total leads × 100.", "Use all 10,000 leads.", "Two decimals."], type: "num", ans: a.convrate, tol: 0.02, unit: "%",
      hint: "1,033 ÷ 10,000.", sol: "SELECT ROUND(COUNT_IF(is_converted) * 100.0 / COUNT(*), 2) FROM STG.fact_lead;   -- 10.33" },
    { id: "a3", tool: "SQL · KPI", track: "kpi", t: "What is the Win Rate %? (two decimals)",
      task: ["Won ÷ (Won + Lost).", "Exclude open opportunities from the denominator.", "Two decimals."], type: "num", ans: a.winrate, tol: 0.05, unit: "%",
      hint: "If you get 31.06%, you divided by all opportunities.", sol: "SELECT ROUND(COUNT_IF(won) * 100.0 / COUNT_IF(closed), 2) FROM STG.fact_opportunity;   -- 42.77\n\n-- DAX\nWin Rate = DIVIDE([Won Opps], [Closed Opps])" },
    { id: "a4", tool: "SQL", track: "sql", t: "What is Total Won Revenue, in $ millions? (two decimals)",
      task: ["Clean Amount ('$' and commas).", "SUM Amount where Won = TRUE.", "Divide by 1,000,000."], type: "num", ans: Math.round(a.won_rev / 1e4) / 100, tol: 0.02, unit: "$M",
      hint: "If Amount is still text, SUM fails or returns 0.", sol: "SELECT ROUND(SUM(amount) / 1e6, 2) FROM STG.fact_opportunity WHERE won;   -- 136.26" },
    { id: "a5", tool: "Excel", track: "excel", t: "What is the Expected Pipeline Value of open deals, in $ millions?",
      task: ["Filter Closed = FALSE.", "SUM the cleaned Expected Amount.", "Two decimals in $M."], type: "num", ans: Math.round(a.pipe / 1e4) / 100, tol: 0.02, unit: "$M",
      hint: "Expected Amount already equals Amount × Probability.", sol: "=SUMIFS(Expected_Amount_Clean, Closed, FALSE) / 1E6   → 47.88" },
    { id: "a6", tool: "Tableau", track: "tableau", t: "Which lead source (100+ leads) has the highest conversion rate?",
      task: ["Bar chart: Lead Source vs conversion %.", "Filter to sources with at least 100 leads.", "Read the top bar."], type: "select", options: ["Inside Sales", "Website", "Trade Show", "Webinar", "Advertisement", "Field Sales", "Prospecting Journey", "Eblasts"], ans: "Field Sales",
      hint: "It's not the biggest source, and it's a sales-generated one.", sol: "Field Sales: 28.2% (577 leads). Website 23.1%. Inside Sales, the biggest source, converts only 1.3%." },
    { id: "a7", tool: "Power BI", track: "powerbi", t: "Write the Converted Opportunities measure. What does it return?",
      task: ["fact_lead has a conv_opp_id column.", "Several leads can convert into the same opportunity.", "Put the measure on a card."], type: "num", ans: a.conv_opp, tol: 0, unit: "opportunities",
      hint: "COUNT gives 411. You need distinct, non-blank values.", sol: "Converted Opportunities = DISTINCTCOUNTNOBLANK ( fact_lead[conv_opp_id] )   -- 375" },
    { id: "a8", tool: "SQL", track: "kpi", t: "What is the Average Deal Size of won deals (blank amounts excluded), in $?",
      task: ["Won deals only.", "AVG ignores NULL amounts.", "Round to the nearest dollar."], type: "num", ans: Math.round(a.avgdeal), tol: 1, unit: "$",
      hint: "1,429 won deals have an Amount.", sol: "SELECT ROUND(AVG(amount)) FROM STG.fact_opportunity WHERE won;   -- 95,354\n-- $94,429 if the 14 blanks were treated as $0" },
    { id: "a9", tool: "QA", track: "qa", t: "Your joined model shows $336.72M won revenue for deals with products. What's the correct figure, in $M?",
      task: ["Take the won deals that have Opportunity Product rows.", "Sum Amount once per deal (not per line).", "Two decimals in $M."], type: "num", ans: Math.round(a.dup_true / 1e4) / 100, tol: 0.02, unit: "$M",
      hint: "1,207 deals, 2,900 line items: each Amount was repeated ~2.4 times.", sol: "See SQL Lab query 8 → 108.73 ($M). Fix: keep fact_opportunity and fact_opp_product at their own grain; never SUM Opportunity Amount over line items." },
    { id: "a10", tool: "Data Model", track: "model", t: "How many opportunities reference an Account ID that isn't in the Account export?",
      task: ["LEFT JOIN Opportunity to Account on Account ID.", "Count rows where the account side is NULL.", "Decide how the model should handle them."], type: "num", ans: a.acc_missing, tol: 0, unit: "opportunities",
      hint: "An INNER JOIN returns 4,523 rows instead of 4,646.", sol: "SELECT COUNT(*) FROM STG.fact_opportunity o LEFT JOIN STG.dim_account a ON a.account_id = o.account_id WHERE a.account_id IS NULL;   -- 123\nKeep them with a LEFT JOIN and an 'Unknown account' member." },
    { id: "a11", tool: "Data Quality", track: "model", t: "How many Closed Won deals have a Close Date before their Created Date?",
      task: ["Days_to_Close = Close Date − Created Date.", "Won deals only.", "Count negatives."], type: "num", ans: a.d2c_neg, tol: 0, unit: "deals",
      hint: "This is why the average (99.4) and median (26) are so far apart.", sol: "SELECT COUNT_IF(won AND days_to_close < 0) FROM STG.fact_opportunity;   -- 244" },
    { id: "a12", tool: "Business Analysis", track: "career", t: "What is the #1 Closed Lost Reason?",
      task: ["Closed = TRUE and Won = FALSE.", "Count by Closed Lost Reason.", "Then write one recommendation for it."], type: "select", options: ["Non Responsive", "Duplicate opportunity", "Other", "Lost or No Budget", "Contact has moved", "Price", "Competitive product"], ans: "Non Responsive",
      hint: "It's not price or competition.", sol: "Non Responsive: 476 lost deals (Duplicate opportunity is next with 419).\nRecommendation: a defined follow-up cadence (e.g. 5 touches in 3 weeks) before a deal can be closed as non-responsive." },
  ];
}

/* ---------------- ANALYST THINKING LAB ---------------- */
const LAB = [
  { t: "Win rate 'dropped' to 31%", scn: "A new Power BI page shows Win Rate at 31.06%. Last quarter's Excel report said 42.77%. The sales director asks what went wrong.", opts: [["Tell the team performance fell", "weak"], ["Check the measure's denominator", "best"], ["Refresh the dataset", "ok"], ["Use the Excel number", "weak"]],
    exp: ["31.06% = 1,443 won ÷ 4,646 all deals; that's Opportunity Conversion Rate.", "Win Rate divides by closed deals: 1,443 ÷ 3,374 = 42.77%.", "Fix the measure and add a QA test that Win% + Loss% = 100%."] },
  { t: "Revenue tripled overnight", scn: "After adding a product slicer, the Won Revenue card jumps from $136M to over $300M.", opts: [["Celebrate", "weak"], ["Check if Opportunity Product was joined to the deal table", "best"], ["Remove the slicer", "ok"], ["Divide by 3", "weak"]],
    exp: ["Each deal's Amount now repeats on every product line.", "For deals with products, $108.73M becomes $336.72M.", "Keep facts at their own grain; use Total Price for product views."] },
  { t: "Inside Sales wants more budget", scn: "Inside Sales generated 2,786 leads, the most of any source, and asks for a bigger budget.", opts: [["Approve, since volume is highest", "weak"], ["Compare conversion rate and won revenue by source", "best"], ["Cut Inside Sales", "weak"], ["Survey the team", "ok"]],
    exp: ["Inside Sales converts 1.3% vs 28.2% for Field Sales and 23.1% for Website.", "Volume isn't value: check how many converted leads became won deals.", "Recommend a qualification review before more budget."] },
  { t: "Pipeline looks huge", scn: "The CRO quotes $247M of open pipeline in a board meeting.", opts: [["Agree", "weak"], ["Show weighted pipeline and stale deals", "best"], ["Remove open deals", "weak"], ["Ask reps to update stages", "ok"]],
    exp: ["Weighted by probability, it's $47.88M.", "772 open deals are already past their close date; 877 are over a year old.", "Present weighted pipeline after a hygiene filter."] },
  { t: "Duplicate losses", scn: "419 deals are 'Closed Lost — Duplicate opportunity'. Sales ops asks if win rate should change.", opts: [["Ignore it", "weak"], ["Show win rate with and without duplicates, and agree a definition", "best"], ["Delete them", "weak"], ["Reclassify as won", "weak"]],
    exp: ["Duplicates aren't real sales losses: excluding them, win rate is 48.8%.", "Changing a KPI definition needs business sign-off.", "Fix the root cause: a duplicate check in Salesforce."] },
  { t: "'Sales is down' in 2021", scn: "The CEO says 2021 was a bad sales year: won revenue fell 8.8%.", opts: [["Blame the reps", "weak"], ["Decompose into deal count, deal size and win rate", "best"], ["Compare with 2019", "ok"], ["Wait for 2022", "weak"]],
    exp: ["Won deals fell 445 → 294, but deal size rose $102K → $142K.", "Win rate actually improved 42.0% → 45.9%.", "The issue is pipeline volume reaching a decision, not closing skill."] },
  { t: "Converted leads don't close", scn: "Marketing reports 1,659 opportunities created from lead conversion and wants credit for them.", opts: [["Give full credit", "weak"], ["Compare win rate by opportunity origin", "best"], ["Ignore marketing", "weak"], ["Count only won ones", "ok"]],
    exp: ["Opportunities from lead conversion win 20.6% vs 52.8% for sales-created ones.", "Credit should follow won revenue, not deal count.", "Agree an MQL → SQL qualification bar with sales."] },
  { t: "Average days to close is 99", scn: "Leadership wants to promise customers delivery based on 'about 100 days to close'.", opts: [["Use 99.4 days", "weak"], ["Check the distribution and the negative values", "best"], ["Use the max", "weak"], ["Use the median", "ok"]],
    exp: ["244 won deals have Close Date before Created Date.", "The median is 26 days; excluding negatives the mean is 124.4.", "Report median + percentiles and fix the date entry."] },
  { t: "Regional manager RLS", scn: "Regional managers must see only their region, but the Region column is empty.", opts: [["Skip RLS", "weak"], ["Build a territory mapping table from Billing Country/State", "best"], ["Use Industry as region", "weak"], ["Ask Salesforce admin to fill Region", "ok"]],
    exp: ["Region is empty in both Account and Lead.", "Billing Country is filled but messy ('USA', 'United States', 'UNITED STATES'): standardise it.", "Map country/state → region and drive RLS from that table."] },
  { t: "Power BI total < Salesforce", scn: "Salesforce shows 4,646 opportunities; your Power BI count shows 4,523.", opts: [["Re-export", "weak"], ["Check for an inner join to Account", "best"], ["Blame the connector", "weak"], ["Check refresh time", "ok"]],
    exp: ["123 opportunities reference Account IDs missing from the Account export.", "An inner join (or a both-direction filter) drops them.", "Use LEFT joins and an 'Unknown account' member."] },
  { t: "Report shows exactly 2,000 rows", scn: "A teammate connected Power BI to a Salesforce report and gets exactly 2,000 opportunities.", opts: [["Accept it", "weak"], ["Recognise the Reports connector limit and switch source", "best"], ["Split the report", "ok"], ["Increase refresh", "weak"]],
    exp: ["The Salesforce Reports connector is limited to 2,000 rows.", "Use the Salesforce Objects connector, or a warehouse (Snowflake here).", "Always reconcile row counts after any connector change."] },
  { t: "Lead score dashboard", scn: "Marketing wants a 'lead score by source' chart. Average score is 1.56.", opts: [["Build it as asked", "weak"], ["Check score coverage first", "best"], ["Replace blanks with 0", "weak"], ["Use Pardot Score instead", "ok"]],
    exp: ["Only 603 of 10,000 leads have a score.", "A chart on 6% of leads misleads; blanks as 0 make it worse (0.09).", "Show coverage % next to the average, and fix scoring upstream."] },
];

/* ---------------- INTERVIEW QUESTIONS ---------------- */
const QA_CATS = M_QA_CATS.slice(0, 6).concat(["Scenario-Based"], M_QA_CATS.slice(6));
const QA = M_QA.map(q => ({ ...q, a: q.a.replace(/Jan(uary)? 2019\s*[–-]\s*Sep(tember)? 2020/g, "2013–2021 (mostly 2020–2021)") }));
QA.forEach(q => { if (/soft-deleted/i.test(q.q)) q.a += " Note: in this particular export the Deleted flag is FALSE on every row, so the check returns 0, but it must stay in place for future refreshes."; });
QA.push(
  { cat: "Explain This Project", q: "What was your most important insight?", a: `Two stand out. First, revenue is concentrated: ${A.enterprise_n} Enterprise deals over $200K bring ${f1(A.enterprise_share)}% of the ${usdM(A.won_rev)} won revenue. Second, the 2021 'drop' (−8.8%) wasn't a selling problem: win rate improved from 42.0% to 45.9% and deal size grew, but fewer deals reached a decision (445 → 294 won). That moves the conversation from 'coach the reps' to 'fix pipeline generation'.`, signal: "Tests going beyond a chart to a correct 'so what'." },
  { cat: "Explain This Project", q: "Which data-quality issue changed a number the most?", a: "The line-item join. For won deals with products, summing Opportunity Amount after joining Opportunity Product gives $336.72M instead of $108.73M, 3.1× too high. Close behind: the Win Rate denominator (31.06% vs 42.77%) and using Status instead of the Converted flag (907 vs 1,033 converted leads).", signal: "Tests specific, quantified data-quality stories." },
  { cat: "SQL / Snowflake", q: "How do you parse M/D/YYYY dates and '$54,805.00' amounts in Snowflake?", a: "<code>TO_TIMESTAMP(\"Created Date\", 'MM/DD/YYYY HH24:MI')</code>, <code>TO_DATE(\"Close Date\", 'MM/DD/YYYY')</code> and <code>TRY_TO_NUMBER(REPLACE(REPLACE(\"Amount\", '$', ''), ',', ''), 18, 2)</code>. TRY_ versions return NULL instead of failing on bad values, so you can count the failures in a QA query.", signal: "Tests practical cleaning syntax." },
  { cat: "Power BI & DAX", q: "Why does Converted Opportunities need DISTINCTCOUNTNOBLANK?", a: "411 converted leads point to only 375 distinct opportunities (several leads merge into one deal), and unconverted leads have a blank conv_opp_id. COUNT gives 411; DISTINCTCOUNT would count BLANK as one extra value; DISTINCTCOUNTNOBLANK gives the correct 375.", signal: "A precise DAX detail with a real number." },
  { cat: "Data Modeling", q: "How would you handle the 123 opportunities whose Account ID isn't in the Account table?", a: "Keep them: LEFT JOIN in the mart view, add an 'Unknown account' row in dim_account (or let Power BI's blank member show), and log them in the Data Quality Log. An inner join would silently remove $ value and make Power BI disagree with Salesforce.", signal: "Tests referential-integrity judgement." },
  { cat: "Scenario-Based", q: "The sales director asks: 'What's our real win rate?' How do you answer?", a: "Give the agreed definition first: 42.77% (won ÷ closed). Then the sensitivity: excluding 419 'Duplicate opportunity' losses it's 48.8%, and by industry it ranges from 20.8% (Communications) to 52.9% (State and Local). Offer to make the duplicate rule part of the official definition if the business agrees.", signal: "Tests definitions plus context." },
  { cat: "Scenario-Based", q: "Marketing and sales disagree on the number of converted leads (907 vs 1,033). Who's right?", a: "Both are reading real fields: Status = 'Converted' (907) vs the Converted flag (1,033). The flag is set by Salesforce's conversion process, so it's the reliable source; Status is a manually maintained picklist. Agree on the flag, document it in the KPI library, and raise the Status inconsistency with the Salesforce admin.", signal: "Tests reconciling definitions between teams." },
  { cat: "Scenario-Based", q: "The board deck says pipeline is $247M. Do you agree?", a: "Only as unweighted Amount. Weighted by stage probability it's $47.88M, and 772 open deals already have a close date in the past. I'd present the weighted number after a hygiene filter and show the unweighted figure as context.", signal: "Tests challenging a headline number constructively." },
  { cat: "Scenario-Based", q: "Leadership wants 'pipeline as of every month-end' from this export. Can you do it?", a: "Not reliably: the export has only the current Stage and a Last Stage Change Date, no stage history. I'd say so, start monthly snapshots in Snowflake now (a scheduled task inserting open deals with a snapshot date), and build the trend from the snapshot table going forward.", signal: "Tests honesty about data limits plus a concrete plan." },
);

const GLOSSARY = M_GLOSSARY.concat([
  { t: "OpportunityLineItem", d: "Salesforce object for the products on a deal (Opportunity Product in this export). Lower grain than Opportunity." },
  { t: "Weighted pipeline", d: "SUM(Amount × Probability) of open deals. In this export it's the Expected Amount column: $47.88M." },
  { t: "Salesforce Objects connector", d: "Power BI connector that reads individual Salesforce objects (tables); no 2,000-row limit." },
  { t: "Salesforce Reports connector", d: "Power BI connector that reads existing Salesforce reports; limited to 2,000 rows." },
  { t: "API name", d: "The technical name of a Salesforce field (CloseDate) vs its label (Close Date). Custom ones end in __c." },
  { t: "Role-playing date", d: "One Date table used for several dates (Created, Close) through one active and inactive relationships." },
  { t: "Pipeline snapshot", d: "A periodic copy of open deals with a snapshot date, so past pipeline can be reported." },
  { t: "Dynamic RLS", d: "Row-level security that filters by the logged-in user, e.g. [Email] = USERPRINCIPALNAME()." },
  { t: "Pipeline coverage", d: "Open (or weighted) pipeline ÷ sales target, e.g. 3x." },
  { t: "Deal-size band", d: "Small <$10K / Mid $10K–50K / Large $50K–200K / Enterprise >$200K." },
]);
const TIPS = M_TIPS.concat([{ n: "09", h: "Know the Salesforce + Power BI questions", p: "Connectors, grain, role-playing dates, RLS and reconciliation are asked in almost every CRM BI interview. They're all in the Interview tab, with AXon numbers." }]);
const TIP_CALLOUT = M_TIP_CALLOUT;
const WEAK_STRONG = [
  { q: "How did you calculate Win Rate?", weak: "Won opportunities divided by total opportunities.", strong: "Won divided by closed deals, won plus lost: 1,443 ÷ 3,374 = 42.77%. Dividing by all 4,646 gives 31.06%, which is Opportunity Conversion Rate, because 1,272 deals are still open. I also showed it excluding 419 duplicate-opportunity losses (48.8%) as a definition question for the business." },
  { q: "How did you calculate product revenue?", weak: "I joined opportunities and products and summed the amount.", strong: "From Opportunity Product's Total Price, at line-item grain. Summing Opportunity Amount after the join repeats each deal's amount on every line: for won deals with products it shows $336.72M instead of $108.73M. Deal-level KPIs stay on fact_opportunity." },
  { q: "How many leads converted?", weak: "907, from the Status column.", strong: "1,033, from the Converted flag, which Salesforce sets when a lead is actually converted. Status = 'Converted' is a manually kept picklist that's out of sync on 126 leads, and Status (Simplified) is 'Open' on every row, so neither is reliable." },
];

/* ---------------- 90-SEC PITCH ---------------- */
const PITCH_FLOW = [
  { t: "Business Problem", d: "CRM data in silos; marketing and sales report different numbers.", s: "~10 s", key: ["problem", "silo", "spreadsheet", "different"] },
  { t: "Data Sources", d: "5 Salesforce exports: 10,000 leads, 4,646 opportunities, 3,052 accounts.", s: "~10 s", key: ["salesforce", "10,000", "4,646", "leads"] },
  { t: "Data Cleaning", d: "Amount text, orphan accounts, negative close days, Status vs Converted flag.", s: "~10 s", key: ["clean", "quality", "amount", "orphan"] },
  { t: "Data Model", d: "Snowflake Raw → Staging → Mart; facts at lead, deal and line-item grain.", s: "~10 s", key: ["snowflake", "staging", "mart", "grain"] },
  { t: "KPIs", d: "23 KPIs: conversion, win rate, won revenue, weighted pipeline…", s: "~10 s", key: ["kpi", "win rate", "conversion", "pipeline"] },
  { t: "Dashboard", d: "Lead Analytics + Opportunity Performance in Power BI and Tableau.", s: "~10 s", key: ["dashboard", "power bi", "tableau"] },
  { t: "Insights", d: "42.8% win rate; 59 deals = 65% of revenue; 2021 drop = fewer deals, not worse selling.", s: "~15 s", key: ["insight", "42", "revenue", "deals"] },
  { t: "Business Impact", d: "Lead-source budget shift, duplicate control, pipeline clean-up.", s: "~15 s", key: ["recommend", "impact", "budget", "clean"] },
];
const ELEVATOR_PITCH = `AXon's marketing and sales teams worked from manual Salesforce exports, so lead conversion, win rate and pipeline were reported differently by every team. I built a CRM analytics solution on five Salesforce exports: 10,000 leads, 4,646 opportunities, 3,052 accounts and 98 users. I loaded them into Snowflake in Raw, Staging and Mart layers, cleaned text amounts and dates, and found issues that changed real numbers: summing deal amounts after joining product lines tripled revenue, and dividing by all opportunities pushed win rate down from 42.8% to 31%. I implemented 23 KPIs in Power BI and Tableau, reconciled to SQL within 0.1%. The key insights: 59 enterprise deals bring 65% of won revenue, Inside Sales generates the most leads but converts only 1.3%, and the 2021 revenue dip came from fewer deals reaching a decision, not from worse selling, since win rate actually improved. I recommended shifting lead budget to higher-converting sources, a duplicate-opportunity check, and a pipeline clean-up of 772 overdue open deals.`;
const PROJECT_FAQ = M_PROJECT_FAQ;

/* ---------------- CAREER ---------------- */
const RESUME_PROJECT = {
  title: "CRM Sales & Marketing Analytics — AXon (Salesforce → Snowflake → Power BI/Tableau, Capstone)",
  tools: "Tools: Snowflake SQL | Excel | Power BI | DAX | Tableau | Salesforce data",
  bullets: [
    "Built a Snowflake ELT pipeline (Raw → Staging → Mart) for 5 Salesforce exports: 10,000 leads, 4,646 opportunities, 3,052 accounts, 98 users",
    "Modelled facts at lead, opportunity and product-line grain, preventing a 3.1× revenue overstatement from line-item joins",
    "Implemented 23 KPIs including lead conversion (10.3%), win rate (42.8%), won revenue ($136.3M) and weighted pipeline ($47.9M)",
    "Developed Lead Analytics and Opportunity Performance dashboards in Power BI and Tableau with drill-through pages",
    "Reconciled all P1 KPIs between Snowflake SQL, Power BI and Tableau to within ±0.1%",
    "Showed the 2021 revenue dip came from fewer closed deals (445 → 294) while win rate improved, redirecting focus to pipeline generation",
  ],
};
const RESUME_BULLETS = [
  "Built Lead and Opportunity dashboards in Power BI and Tableau over 10,000 Salesforce leads and 4,646 deals, reconciling 23 KPIs to Snowflake SQL within ±0.1%.",
  "Prevented a 3.1× revenue overstatement by modelling opportunity and product-line facts at their own grain, and corrected a win-rate definition error (31% → 42.8%).",
  "Identified that 59 enterprise deals drive 65% of won revenue and that the top lead source converts at only 1.3%, informing budget and sales-focus recommendations.",
];
const LINKEDIN_POST = "Just wrapped up my CRM Analytics capstone 📈\n\nThe problem: marketing and sales each had their own numbers from manual Salesforce exports.\n\nWhat I built:\n❄️ A Snowflake ELT pipeline (Raw → Staging → Mart) for 5 Salesforce objects\n🧮 23 KPIs: lead conversion, win rate, won revenue, weighted pipeline\n📊 Lead & Opportunity dashboards in Power BI and Tableau, reconciled with SQL\n\nBiggest lesson: join deals to their product lines and sum the deal amount, and revenue triples. Grain matters!\n\nThanks to Mahendra Singh for the guidance!\n\n#DataAnalytics #Salesforce #Snowflake #PowerBI #Tableau #CRM";
const PORTFOLIO = [
  { n: "01", h: "Publish to Tableau Public", p: "Upload both dashboards with a clear title, a one-line description and KPI definitions in tooltips." },
  { n: "02", h: "Record a 2-minute walkthrough", p: "Screen-record the dashboards while giving your 90-second pitch. Post it on LinkedIn." },
  { n: "03", h: "GitHub repo", p: "Snowflake SQL (raw, staging, mart, QA), the data dictionary, KPI definitions and screenshots, with a clear README." },
  { n: "04", h: "Write a Medium post", p: "\"Why my revenue tripled: the Opportunity vs line-item grain trap\" makes a great short write-up." },
  { n: "05", h: "Add it to LinkedIn Featured", p: "Pin the Tableau Public link and the walkthrough video." },
  { n: "06", h: "Prepare the deck", p: "All 10 BRD sections: architecture, model, KPIs, wireframes, dashboards, insights, QA approach." },
];

/* ---------------- LEARN MORE ---------------- */
const LEARNING_LINKS = [
  { title: "90-Day AI Learning", desc: "After this project, start your AI journey: a 90-day, week-by-week AI engineer learning plan with a project every week.", url: "https://90daysailearning.vercel.app/", source: "AI Learning" },
  { title: "Data Analyst Roadmap (roadmap.sh)", desc: "A step-by-step visual roadmap of every skill a data analyst needs, from Excel and SQL to statistics and BI tools.", url: "https://roadmap.sh/data-analyst", source: "roadmap.sh" },
  { title: "Power BI: Salesforce Objects connector", desc: "Microsoft's official guide: prerequisites (API access), API version and field limits.", url: "https://learn.microsoft.com/en-us/power-query/connectors/salesforce-objects", source: "Microsoft" },
  { title: "Power BI: Salesforce Reports connector", desc: "Official page, including the 2,000-row limit and the Objects-connector workaround.", url: "https://learn.microsoft.com/en-us/power-query/connectors/salesforce-reports", source: "Microsoft" },
].concat(M_LEARNING_LINKS);

/* ---------------- CHAT config ---------------- */
const SYNONYMS = {
  "win": ["win rate", "won"], "winrate": ["win rate"], "conversion": ["converted", "convert"], "convert": ["conversion", "converted"], "pipeline": ["expected", "open", "weighted"],
  "deal": ["opportunity"], "opportunity": ["deal", "opp"], "line": ["opportunity product", "lineitem"], "product": ["opportunity product", "lineitem"],
  "salesforce": ["connector", "objects", "reports"], "connector": ["salesforce objects", "salesforce reports"], "rls": ["row level security", "userprincipalname"],
  "dax": ["measure", "power bi"], "sql": ["query", "snowflake"], "snowflake": ["copy into", "staging", "mart"], "trap": ["gotcha", "mistake"], "mistake": ["gotcha", "trap"],
};
const INTENT_RULES = [
  { re: /win rate|winrate/i, title: "Win Rate denominator = closed deals only" },
  { re: /line ?item|opportunity product|duplicat.*amount|200,?000/i, title: "Don't sum Opportunity Amount after joining line items" },
  { re: /2,?000 (rows|records)|reports connector/i, title: "Q56. Salesforce Report contains 100,000 records but Power BI shows only 2,000. Why?" },
  { re: /objects vs|objects and reports|objects or reports/i, title: "Q2. What is the difference between Salesforce Objects and Salesforce Reports connector?" },
  { re: /\brls\b|row.level/i, title: "Q20. Sales representatives should see only their own Salesforce opportunities. How would you implement this?" },
  { re: /weighted/i, title: "Q28. What is Weighted Pipeline?" },
  { re: /status.*convert|converted flag/i, title: "Use the Converted flag, not Status" },
];
const CHAT_POPULAR = ["How is Win Rate calculated?", "Opportunity vs line item trap", "Salesforce Objects vs Reports", "What is weighted pipeline?", "Dynamic RLS for sales reps", "Give me a scenario question"];
const QUICK_REPLY_POOL = ["How is Win Rate calculated?", "Opportunity vs line item trap", "Salesforce Objects vs Reports", "What is weighted pipeline?", "Dynamic RLS for sales reps", "Why only 2,000 rows?",
  "CreatedDate or CloseDate?", "Converted flag vs Status", "Lead vs Contact", "Give me a scenario question"];
/* ============================================================
   References, sample dashboard images, and 12 common CRM
   dashboard types (with how to build each from the AXon data).
   ============================================================ */
const SRC = {
  sfo: ["Microsoft Learn: Power Query Salesforce Objects connector", "https://learn.microsoft.com/en-us/power-query/connectors/salesforce-objects"],
  sfr: ["Microsoft Learn: Power Query Salesforce Reports connector", "https://learn.microsoft.com/en-us/power-query/connectors/salesforce-reports"],
  star: ["Microsoft Learn: Understand star schema for Power BI", "https://learn.microsoft.com/en-us/power-bi/guidance/star-schema"],
  ur: ["Microsoft Learn: USERELATIONSHIP (DAX)", "https://learn.microsoft.com/en-us/dax/userelationship-function-dax"],
};
const QA_REFERENCES = Object.values(SRC);


const SAMPLE_IMAGE_DASHBOARDS = [
  { img: "assets/lead-dashboard-sample.png", t: "Lead Analytics Dashboard (wireframe)", by: "Project wireframe (from the BRD)",
    does: "Shows marketing how many leads arrive, from where, and how many convert.",
    kpis: "Total Leads, Converted Leads, Lead Conversion Rate, Expected Revenue (Converted)",
    visuals: "KPI cards, lead volume trend, leads-by-source donut, conversion by source, status and industry bars, summary table",
    proxima: "Gallery pages 01 and 02. Use the Converted flag and DISTINCT conversion IDs." },
  { img: "assets/opp-dashboard-sample.png", t: "Opportunity Performance Dashboard (wireframe)", by: "Project wireframe (from the BRD)",
    does: "Shows sales leadership revenue, win/loss and what's left in the pipeline.",
    kpis: "Active Opportunities, Total Won Revenue, Win Rate, Loss Rate, Expected Pipeline, Avg Deal Size",
    visuals: "KPI cards, pipeline stage funnel, monthly trend, win vs lost by industry, loss reasons, top accounts",
    proxima: "Gallery pages 03 and 04. Win Rate over closed deals only; no line-item columns on revenue visuals." },
  { img: "assets/hero-mockup.png", t: "CRM Overview Concept", by: "Concept mockup (illustrative values)",
    does: "A one-page funnel from leads to contacts to opportunities to customers, with a sales trend and lead-source mix.",
    kpis: "Total customers, funnel stage counts, sales trend, lead source split",
    visuals: "Funnel, KPI card, trend line, donut",
    proxima: "Layout idea for an executive summary page; replace the values with the KPI Library answer key." },
];

const VIDI_DASHBOARDS = [
  { name: "Sales Executive Summary", tool: "Power BI / Tableau", tag: "One page for the CRO and CEO",
    context: "Replaces the weekly pack of exported Salesforce reports.", what: "Won revenue, win rate, weighted pipeline and lead conversion for the period, with change vs last period.",
    question: "Are we on track, and what changed since last period?", who: "CEO, CRO, sales directors",
    kpis: ["Total Won Revenue", "Win Rate", "Expected Pipeline", "Lead Conversion Rate", "Avg Deal Size"], visuals: ["KPI cards with arrows", "Won revenue by month", "Pipeline by stage", "Top accounts"],
    filters: "Close date, industry, owner", build: ["Measures from the KPI Library", "Close Date as the active date", "Max 6 cards + 4 visuals"],
    proxima: "$136.26M won, 42.77% win rate, $47.88M weighted pipeline, 10.33% lead conversion.", page: "03 Opportunity Performance" },
  { name: "Pipeline & Forecast", tool: "Power BI", tag: "What's open, how likely, and how stale?",
    context: "Used in weekly pipeline reviews and quarterly forecasts.", what: "Open deals by stage and close month, weighted vs unweighted value, forecast category, ageing.",
    question: "How much will we close this quarter, and which deals are stuck?", who: "Sales managers, sales ops",
    kpis: ["Open opportunities", "Weighted pipeline", "Unweighted pipeline", "Deals past close date", "Pipeline age"], visuals: ["Stage funnel", "Pipeline by close month", "Forecast category stacked bar", "Stale-deal table"],
    filters: "Owner, stage group, close quarter", build: ["Weighted = SUM(Expected_Amount) for open deals", "Flag open deals with Close Date < as-of date", "Forecast Category from the export"],
    proxima: "1,272 open deals: $247.48M raw, $47.88M weighted; 772 already past their close date.", page: "03 Opportunity Performance" },
  { name: "Win/Loss Analysis", tool: "Power BI / Tableau", tag: "Why do we win and lose?",
    context: "Used by sales leadership and product marketing after each quarter.", what: "Win rate by industry, source, rep and deal size; loss reasons; competitor mentions.",
    question: "Where do we win, and what makes us lose?", who: "Sales directors, product marketing",
    kpis: ["Win Rate", "Loss Rate", "Loss reasons", "Win rate by segment"], visuals: ["Win vs lost grouped bar by industry", "Loss reason Pareto", "Win rate by source"],
    filters: "Industry, owner, close period", build: ["Closed deals only in every rate", "Show blank loss reasons as '(blank)'", "Optional: win rate excluding duplicates"],
    proxima: "Top two loss reasons (Non Responsive, Duplicate) = 46% of losses; win rate 48.8% excluding duplicates.", page: "04 Win/Loss, Accounts & Reps" },
  { name: "Lead Funnel & Marketing Attribution", tool: "Power BI", tag: "Which sources create customers?",
    context: "Marketing's main dashboard for budget decisions.", what: "Leads by source and status, conversion rates, converted value, lead ageing.",
    question: "Which channels are worth the budget?", who: "Marketing head, demand generation",
    kpis: ["Total Leads", "Converted Leads", "Lead Conversion Rate", "Expected Revenue (Converted)", "Avg Age of Open Leads"], visuals: ["Leads by source", "Conversion % by source", "Status funnel", "Lead trend"],
    filters: "Lead source, industry, created date", build: ["Converted flag, not Status", "DISTINCT conversion IDs", "Sources with 100+ leads for rates"],
    proxima: "Inside Sales: 2,786 leads at 1.3% conversion; Field Sales 28.2%; Website 23.1%.", page: "01–02 Lead Analytics" },
  { name: "Sales Rep Performance", tool: "Power BI / Tableau", tag: "Who is selling, and who needs coaching?",
    context: "Used in 1:1s and team reviews.", what: "Won revenue, win rate, pipeline, deal size and cycle time by owner.",
    question: "Which reps hit target, and which need help closing?", who: "Sales managers",
    kpis: ["Won revenue by rep", "Win rate by rep", "Open pipeline by rep", "Avg deal size", "Days to close"], visuals: ["Leaderboard table", "Revenue vs win rate scatter", "Pipeline by rep"],
    filters: "Team, period, industry", build: ["dim_user via owner_id", "Minimum 50 closed deals for win rate", "RLS so reps see only their rows"],
    proxima: "Jonathan Patterson $38.9M (top revenue); Benjamin Young 74.8% (top win rate).", page: "04 Win/Loss, Accounts & Reps" },
  { name: "Account / Customer 360", tool: "Power BI", tag: "Everything about one customer",
    context: "Used by account managers before customer meetings.", what: "An account's deals, revenue history, open pipeline, products bought and contacts.",
    question: "What's our relationship with this customer worth, and what's next?", who: "Account managers, sales leadership",
    kpis: ["Lifetime won revenue", "Open pipeline", "# deals", "Products bought"], visuals: ["Account selector + cards", "Deal timeline", "Products table"],
    filters: "Account, industry", build: ["dim_account as the slicer", "Product view from fact_opp_product (Total Price)", "Keep orphan deals as 'Unknown account'"],
    proxima: "Federal Resources: $31.52M won; PM Countermine & EOD: $26.61M.", page: "04 Win/Loss, Accounts & Reps" },
  { name: "Product Sales", tool: "Power BI", tag: "Which products sell?",
    context: "Used by product and pricing teams.", what: "Revenue, quantity, discount and price by product, from opportunity line items.",
    question: "Which products drive revenue, and how much do we discount?", who: "Product managers, pricing",
    kpis: ["Product revenue (Total Price)", "Quantity", "Avg discount", "Product mix"], visuals: ["Top products bar", "Discount distribution", "Product × industry matrix"],
    filters: "Product, close period, won/open", build: ["fact_opp_product at line grain", "Never combine with Opportunity Amount", "Filter to won deals for 'sold' revenue"],
    proxima: "Robot Vacuum $86.13M, Portable Power Bank $61.75M across 33 products (all deals).", page: "Extension" },
  { name: "Sales Cycle & Velocity", tool: "Power BI / Tableau", tag: "How fast do deals move?",
    context: "Used to plan capacity and forecast timing.", what: "Days to close, stage duration, push counts, velocity (deals × value × win rate ÷ cycle length).",
    question: "Where do deals slow down?", who: "Sales ops, sales managers",
    kpis: ["Avg / median days to close", "Stage duration", "Sales velocity"], visuals: ["Days-to-close histogram", "Median by industry", "Stage duration bar (needs history)"],
    filters: "Industry, deal size, owner", build: ["Exclude negative days (244 won deals)", "Use median as well as mean", "Stage duration needs a stage-history table"],
    proxima: "Mean 99.4 days but median 26; excluding negatives the mean is 124.4.", page: "03 Opportunity Performance" },
  { name: "Activity & Engagement", tool: "Power BI", tag: "Are reps working the deals?",
    context: "Built on Salesforce Task and Event objects.", what: "Calls, emails, meetings per rep and per deal; deals with no recent activity.",
    question: "Which deals are being neglected?", who: "Sales managers",
    kpis: ["Activities per rep", "Days since last activity", "Deals with overdue tasks"], visuals: ["Activity trend", "Neglected-deal table"],
    filters: "Owner, activity type", build: ["Not in the AXon export (no Task/Event)", "Has Open Activity / Has Overdue Task flags exist on Opportunity", "Add Task and Event to extend"],
    proxima: "Extension: start from the Has Overdue Task flag on Opportunity.", page: "Extension" },
  { name: "Customer Service (Cases)", tool: "Power BI", tag: "How well do we support customers?",
    context: "Built on the Salesforce Case object.", what: "Open cases, resolution time, SLA breaches, CSAT by product and account.",
    question: "Are customers getting help quickly?", who: "Support leads, account managers",
    kpis: ["Open cases", "Avg resolution time", "SLA %", "CSAT"], visuals: ["Case backlog trend", "Resolution time by priority"],
    filters: "Priority, product, account", build: ["Not in the AXon export (no Case object)", "Would join to dim_account", "Mention it as a next data source"],
    proxima: "Out of scope for this dataset.", page: "Extension" },
  { name: "Territory / Regional", tool: "Power BI / Tableau", tag: "How does each region perform?",
    context: "Used by regional managers, usually with RLS.", what: "Revenue, pipeline and win rate by territory, on a map or bar chart.",
    question: "Which territories under- or over-perform?", who: "Regional managers",
    kpis: ["Won revenue by region", "Win rate by region", "Pipeline by region"], visuals: ["Filled map", "Region bar", "Region × industry matrix"],
    filters: "Region, owner", build: ["Region is empty in this export: build a mapping from Billing Country/State", "Standardise 'USA' / 'United States' / 'UNITED STATES'", "Drive RLS from the mapping table"],
    proxima: "Billing Country is filled on 2,939 accounts but spelled several ways.", page: "Extension" },
  { name: "Data Quality Monitor", tool: "Power BI", tag: "Can we trust the CRM data?",
    context: "A page every CRM analytics project should have, refreshed with the data.", what: "Counts of blank amounts, orphan accounts, impossible dates, duplicates and unmapped stages over time.",
    question: "Is the data good enough to report on today?", who: "Sales ops, BI team",
    kpis: ["Blank Amount", "Orphan Account IDs", "Negative days to close", "Duplicate opportunities"], visuals: ["Issue count cards", "Trend per issue", "Drill-to-record table"],
    filters: "Object, owner", build: ["One SQL view per rule (see QA page)", "Snapshot the counts each refresh", "Owner-level table so reps can fix their records"],
    proxima: "474 blank Amounts, 123 orphan Account IDs, 244 negative close days, 419 duplicate losses.", page: "QA & Reconciliation" },
];
/* Salesforce + Power BI interview questions (60 Q + 10 scenarios + project story), detailed answers with AXon data notes */
const SF_QA_CATS = ["SF+PBI · Connection & Objects", "SF+PBI · Modelling & DAX", "SF+PBI · History & Security (RLS)", "SF+PBI · Power Query, Refresh & API", "SF+PBI · Reconciliation & Data Quality", "SF+PBI · Dashboards & Performance", "SF+PBI · Scenarios & Project Story"];
const SF_QA = [
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q1. How do you connect Salesforce with Power BI?",
"a": "<p>Power BI provides Salesforce connectors that allow you to bring Salesforce data into Power BI.</p>\n<p>The two important approaches are:</p>\n<ul><li>Salesforce Objects</li><li>Salesforce Reports</li></ul>\n<p>For a typical enterprise sales dashboard, I would first understand the business requirement and then decide which approach is appropriate.</p>\n<p>For example:</p>\n<pre class=\"qa-pre\">Salesforce\n    |\n    | Salesforce Connector\n    ↓\nPower Query\n    |\n    | Transformation\n    ↓\nPower BI Semantic Model\n    |\n    | DAX\n    ↓\nPower BI Report\n    |\n    ↓\nPower BI Service</pre>\n<p>Suppose the business wants a Sales Performance Dashboard containing:</p>\n<ul><li>Revenue</li><li>Pipeline</li><li>Win Rate</li><li>Sales by Region</li><li>Sales by Sales Rep</li><li>Product Revenue</li><li>Target Achievement</li></ul>\n<p>I may use Salesforce objects such as:</p>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<pre class=\"qa-pre\">Opportunity\nOpportunityLineItem\nProduct\nUser\nCampaign</pre>\n<p>I would then transform the data in Power Query, create a star-schema-based model, develop DAX measures, build the report and publish it to Power BI Service.</p>\n<p class=\"qa-label\"><strong>Strong interview answer</strong></p>\n<blockquote>&quot;I would connect Salesforce to Power BI using the appropriate Salesforce connector. If I need granular control over objects, relationships, transformations and the Power BI semantic model, I would evaluate Salesforce Objects. If the business logic is already defined through Salesforce Reports and the reporting requirement is relatively straightforward, Salesforce Reports can also be considered.&quot;</blockquote><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> Our AXon pipeline is a variation of this: Salesforce export → Snowflake (Raw → Staging → Mart) → Power BI / Tableau. The objects we used are Account (3,052), Lead (10,000), Opportunity (4,646), Opportunity Product = OpportunityLineItem (10,000) and User (98).</div>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "1"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q2. What is the difference between Salesforce Objects and Salesforce Reports connector?",
"a": "<div class=\"qa-table\"><table><thead><tr><th>Salesforce Objects</th><th>Salesforce Reports</th></tr></thead><tbody><tr><td>Access individual Salesforce objects</td><td>Consume existing Salesforce reports</td></tr><tr><td>More modelling flexibility</td><td>Existing Salesforce logic can be reused</td></tr><tr><td>Useful for custom semantic models</td><td>Useful for predefined reporting</td></tr><tr><td>Better control over relationships</td><td>Less modelling flexibility</td></tr><tr><td>Power BI can build its own business logic</td><td>Salesforce report logic may already exist</td></tr></tbody></table></div>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Suppose Salesforce already has a report called:</p>\n<blockquote>&quot;Closed Won Opportunities - Current Year&quot;</blockquote>\n<p>If the requirement is simply to consume that existing report, Salesforce Reports may be convenient.</p>\n<p>But suppose management wants:</p>\n<pre class=\"qa-pre\">Account\n      +\nOpportunity\n      +\nOpportunityLineItem\n      +\nProduct\n      +\nSales Rep\n      +\nDate</pre>\n<p>and wants Power BI to create its own analytical model.</p>\n<p>In that case, Salesforce Objects would generally provide more modelling control.</p>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "2"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q3. Why would you prefer Salesforce Objects over Salesforce Reports?",
"a": "<p>I would not say that Salesforce Objects is always better.</p>\n<p>Instead, I would explain the decision based on the requirement.</p>\n<p>I would evaluate Salesforce Objects when:</p>\n<p>Multiple Salesforce objects are required.</p>\n<p>I need custom relationships.</p>\n<p>I need Power Query transformations.</p>\n<p>I need my own DAX calculations.</p>\n<p>I need a reusable Power BI semantic model.</p>\n<p>I need more control over the grain of the data.</p>\n<p>Salesforce reports do not provide the required analytical structure.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>If the requirement is:</p>\n<pre class=\"qa-pre\">&quot;Show revenue by Account, Product, Region and Sales Rep and allow users to drill from Account → Opportunity → Product.&quot;</pre>\n<p>I would likely evaluate Salesforce Objects because I need several objects and relationships.</p>\n<p class=\"qa-label\"><strong>Interview answer</strong></p>\n<blockquote>&quot;I would generally evaluate Salesforce Objects when I need to build a reusable Power BI semantic model because it gives me greater control over the individual objects, relationships, transformations and analytical logic.&quot;</blockquote>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "3"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q4. How do you find the correct Salesforce object and field for a business requirement?",
"a": "<p>I would first identify the business requirement and then trace it to the Salesforce data model.</p>\n<p>I would check:</p>\n<ul><li>Salesforce Object</li><li>Field Label</li><li>API Name</li><li>Data Type</li><li>Relationship</li><li>Lookup/Master-Detail relationship</li><li>Permissions</li><li>Field-Level Security</li></ul>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Business requirement:</p>\n<blockquote>&quot;Show Opportunity Close Date.&quot;</blockquote>\n<p>I would identify:</p>\n<p>Object:</p>\n<p>Opportunity</p>\n<p>Field Label:</p>\n<p>Close Date</p>\n<p>API Name:</p>\n<p>CloseDate</p>\n<p>Data Type:</p>\n<p>Date</p>\n<p>I would use the API name when working with technical integrations and transformations rather than relying only on the display label.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In the AXon CSV export the columns arrive with <strong>labels</strong> (e.g. <code>Close Date</code>, <code>Opportunity ID</code>, <code>Expected Amount</code>), not API names (<code>CloseDate</code>, <code>Id</code>, <code>ExpectedRevenue</code>). In Staging we rename them to snake_case once, and document the label → API name mapping in the Data Dictionary.</div>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "4"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q5. What Salesforce objects have you used in Power BI?",
"a": "<p>For a Salesforce Sales Cloud analytics solution, common objects include:</p>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<p class=\"qa-label\"><strong>Contact</strong></p>\n<p class=\"qa-label\"><strong>Lead</strong></p>\n<pre class=\"qa-pre\">Opportunity\nOpportunityLineItem\nProduct\nCampaign\nUser\nCase\nTask\nEvent</pre>\n<p>But I would not simply list objects.</p>\n<p>The interviewer may ask:</p>\n<blockquote>&quot;Why did you use Opportunity?&quot;</blockquote>\n<p>So I would explain the business role of each object.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Object</th><th>Purpose</th></tr></thead><tbody><tr><td>Account</td><td>Customer/company</td></tr><tr><td>Contact</td><td>Person associated with Account</td></tr><tr><td>Lead</td><td>Potential prospect</td></tr><tr><td>Opportunity</td><td>Potential sales deal</td></tr><tr><td>OpportunityLineItem</td><td>Products/services within Opportunity</td></tr><tr><td>Product</td><td>Product master</td></tr><tr><td>User</td><td>Sales representative/owner</td></tr><tr><td>Campaign</td><td>Marketing campaign</td></tr></tbody></table></div><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon uses Account, Lead, Opportunity, Opportunity Product (OpportunityLineItem) and User. There is no Contact or Campaign export, so contact-level or campaign ROI analysis is out of scope and should be said honestly in the interview.</div>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "5"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q6. Explain the relationship between Account and Opportunity.",
"a": "<p>Generally:</p>\n<pre class=\"qa-pre\">Account\n   1\n   |\n   |\n   *</pre>\n<p>Opportunity</p>\n<p>One Account can have multiple Opportunities.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">ABC Corporation\n     |\n     ├── Opportunity A - $50,000\n     ├── Opportunity B - $100,000\n     └── Opportunity C - $25,000</pre>\n<p>Therefore:</p>\n<pre class=\"qa-pre\">One Account → Many Opportunities</pre>\n<p>In Power BI, this can be represented as:</p>\n<pre class=\"qa-pre\">DimAccount\n     |\n     | 1 : *\n     |\nFactOpportunity</pre><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In AXon, 4,646 opportunities link to accounts via <code>Account ID</code>. 123 of them point to an Account ID that is not in the Account export, so a strict inner join would silently drop them. We use a LEFT join and an 'Unknown account' member in dim_account.</div>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "6"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q7. Explain Opportunity and OpportunityLineItem.",
"a": "<p>An Opportunity represents the overall sales deal.</p>\n<p>An OpportunityLineItem represents the individual products/services within that deal.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">Opportunity\nABC Corp Deal\nTotal Amount = $100,000\n       |\n       | 1 : Many\n       ↓\nOpportunityLineItem\n       |\n       ├── Product A = $40,000\n       └── Product B = $60,000</pre>\n<p>So:</p>\n<p>Opportunity = Deal</p>\n<p>OpportunityLineItem = Product/service component of the deal</p>\n<p>This distinction is extremely important when designing a Power BI model.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon has 10,000 Opportunity Product rows spread across 3,210 opportunities (about 3.1 lines per deal, up to 18 lines on one deal).</div>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "7"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q22. What are custom Salesforce objects?",
"a": "<p>Custom objects are Salesforce objects created specifically for an organization&#x27;s business requirements.</p>\n<p>They commonly have an API name ending in:</p>\n<p>__c</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Customer_Segment__c</p>\n<p>Suppose the company creates:</p>\n<p>Partner_Account__c</p>\n<p>to store partner-specific information.</p>\n<p>Power BI can potentially consume the custom object through the Salesforce Objects connector, provided the integration user has the required permissions.</p>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "22"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q23. A stakeholder asks for data from a custom Salesforce object. How would you bring it into Power BI?",
"a": "<p>My approach would be:</p>\n<pre class=\"qa-pre\">Identify Object\n      ↓\nIdentify API Name\n      ↓\nCheck User Access\n      ↓\nCheck Field-Level Security\n      ↓\nConnect through Salesforce Objects\n      ↓\nPower Query Transformation\n      ↓\nData Model\n      ↓\nDAX\n      ↓\nReport</pre>\n<p class=\"qa-label\"><strong>Interview answer</strong></p>\n<blockquote>&quot;First I would identify the custom object&#x27;s API name and confirm that the Salesforce integration user has read access to the object and required fields. Then I would connect through the Salesforce Objects connector, transform the data in Power Query and incorporate it into the Power BI semantic model.&quot;</blockquote>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "23"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q41. What is the difference between Lead and Contact?",
"a": "<p class=\"qa-label\"><strong>Lead</strong></p>\n<p>A Lead generally represents a potential prospect before the organization has fully established the customer relationship.</p>\n<p class=\"qa-label\"><strong>Contact</strong></p>\n<p>A Contact represents a known person associated with an Account.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">Lead\n  ↓\nQualification\n  ↓\nConversion\n  ↓\nAccount + Contact + Opportunity</pre>\n<p>For example:</p>\n<p>Lead:</p>\n<ul><li>John Smith</li><li>Potential customer</li></ul>\n<p>After conversion:</p>\n<p>Account:</p>\n<p>ABC Corporation</p>\n<p>Contact:</p>\n<p>John Smith</p>\n<p>Opportunity:</p>\n<p>ABC Corporation - $250K Deal</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In AXon, converted leads carry Converted Account ID and Converted Opportunity ID. 411 converted leads point to 375 distinct opportunities (some leads merge into the same deal), and to 699 distinct accounts.</div>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "41"
},
{
"cat": "SF+PBI · Connection & Objects",
"q": "Q42. What is the difference between Account and Contact?",
"a": "<p>Account = Organization/company/customer</p>\n<p>Contact = Person associated with the organization</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">Microsoft\n   |\n   ├── John\n   ├── David\n   └── Sarah</pre>\n<p>Here:</p>\n<ul><li>Microsoft = Account</li><li>John       = Contact</li><li>David      = Contact</li><li>Sarah      = Contact</li></ul>\n<p>This distinction is fundamental when creating Salesforce analytical models.</p>",
"signal": "Tests whether you know Salesforce's data model and how it reaches Power BI.",
"n": "42"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q8. How would you model Salesforce Account, Opportunity and Product in Power BI?",
"a": "<p>I would generally aim for a star schema.</p>\n<p>For example:</p>\n<pre class=\"qa-pre\">                 DimDate\n                    |\n                    |\nDimAccount ─── FactOpportunity\n                    |\n                    |\n                    ▼\n          FactOpportunityLineItem\n                    |\n                    |\n                DimProduct</pre>\n<p>Sales representative information could be represented using:</p>\n<p>DimUser / DimSalesRep</p>\n<p>The important thing is to define the grain of every fact table.</p>\n<p>For example:</p>\n<p>FactOpportunity</p>\n<p>One row = one Opportunity</p>\n<p>FactOpportunityLineItem</p>\n<p>One row = one product line within an Opportunity</p>\n<p>This prevents incorrect aggregations.</p>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "8"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q9. What would be the grain of your Opportunity fact table?",
"a": "<p>The grain defines what one row represents.</p>\n<p>If my table is:</p>\n<p>FactOpportunity</p>\n<p>the grain could be:</p>\n<p>One row per Salesforce Opportunity.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Opportunity ID</th><th>Account</th><th>Amount</th><th>Stage</th></tr></thead><tbody><tr><td>O001</td><td>ABC Corp</td><td>100,000</td><td>Proposal</td></tr><tr><td>O002</td><td>XYZ Ltd</td><td>250,000</td><td>Closed Won</td></tr></tbody></table></div>\n<p>If I use OpportunityLineItem:</p>\n<p>One row represents one product line within an Opportunity.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Opportunity</th><th>Product</th><th>Amount</th></tr></thead><tbody><tr><td>O001</td><td>Product A</td><td>40,000</td></tr><tr><td>O001</td><td>Product B</td><td>60,000</td></tr></tbody></table></div><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon grains: fact_opportunity = 1 row per Opportunity ID (4,646, no duplicates); fact_opp_product = 1 row per Line Item ID (10,000); fact_lead = 1 row per Lead ID (10,000).</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "9"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q10. Why shouldn't you simply join Opportunity and OpportunityLineItem and sum Opportunity Amount?",
"a": "<p>Because Opportunity Amount belongs to the Opportunity grain, while OpportunityLineItem belongs to the line-item grain.</p>\n<p>Suppose:</p>\n<p>Opportunity Amount = $100,000</p>\n<p>and there are two products:</p>\n<ul><li>Product A = $40,000</li><li>Product B = $60,000</li></ul>\n<p>After joining:</p>\n<div class=\"qa-table\"><table><thead><tr><th>Opportunity</th><th>Opportunity Amount</th><th>Product</th></tr></thead><tbody><tr><td>O001</td><td>100,000</td><td>A</td></tr><tr><td>O001</td><td>100,000</td><td>B</td></tr></tbody></table></div>\n<p>If I calculate:</p>\n<pre class=\"qa-pre\">SUM(Opportunity[Amount])</pre>\n<p>I could get:</p>\n<pre class=\"qa-pre\">100,000 + 100,000\n= 200,000 ❌</pre>\n<p>The correct Opportunity Amount is:</p>\n<p>100,000 ✅</p>\n<p class=\"qa-label\"><strong>Better modelling approach</strong></p>\n<p>Keep the facts at their appropriate grain:</p>\n<pre class=\"qa-pre\">FactOpportunity\n        |\n        |\nFactOpportunityLineItem</pre>\n<p>Then use the appropriate measure depending on the analytical requirement.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> <strong>This happens in our real data.</strong> For the 1,207 Closed Won opportunities that have line items, the true Won revenue is <strong>$108.73M</strong>. Join them to their 2,900 line items and SUM(Opportunity Amount) gives <strong>$336.72M</strong>, 3.1× too high. The line items' own Total Price adds up to $107.49M, which is the correct number for product-level analysis.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "10"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q11. What is Opportunity Stage?",
"a": "<p>Opportunity Stage represents the current stage of a sales opportunity.</p>\n<p>A typical process might look like:</p>\n<pre class=\"qa-pre\">Prospecting\n     ↓\nQualification\n     ↓\nProposal\n     ↓\nNegotiation\n     ↓\nClosed Won\n     or\nClosed Lost</pre>\n<p>However, I would not assume these exact stages exist in every Salesforce organization, because Salesforce sales processes can be configured.</p>\n<p class=\"qa-label\"><strong>Interview answer</strong></p>\n<blockquote>&quot;Opportunity Stage represents the current position of an opportunity within the organization&#x27;s sales process. For reporting, I can use it to analyse pipeline by stage, conversion, stage progression and closed outcomes.&quot;</blockquote><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon has 12 raw Stage values, from 'Funnel' and 'Qualified Opportunity' to 'Order Expected within 30 Days', 'Closed Won' and 'Closed Lost'. We map them to a Stage_Group (New / Qualified / Late-Stage / Won / Lost) in Staging so both BI tools use the same buckets.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "11"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q12. How would you calculate Closed Won Sales in Power BI?",
"a": "<p>First create the base measure:</p>\n<pre class=\"qa-pre\">Total Sales =\nSUM(Opportunity[Amount])</pre>\n<p class=\"qa-label\"><strong>Then</strong></p>\n<pre class=\"qa-pre\">Closed Won Sales =\nCALCULATE(\n    [Total Sales],\n    Opportunity[StageName] = &quot;Closed Won&quot;\n)</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Suppose:</p>\n<div class=\"qa-table\"><table><thead><tr><th>Opportunity</th><th>Amount</th><th>Stage</th></tr></thead><tbody><tr><td>A</td><td>$100K</td><td>Closed Won</td></tr><tr><td>B</td><td>$200K</td><td>Proposal</td></tr><tr><td>C</td><td>$150K</td><td>Closed Won</td></tr></tbody></table></div>\n<p>Closed Won Sales:</p>\n<p>100K + 150K</p>\n<pre class=\"qa-pre\">= $250K</pre><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon: Total Won Revenue = <strong>$136.26M</strong> from 1,443 Closed Won opportunities (filter <code>Won = TRUE</code>; 14 won deals have a blank Amount).</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "12"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q13. How would you calculate Open Pipeline?",
"a": "<p>A common definition is opportunities that are not closed.</p>\n<pre class=\"qa-pre\">Open Pipeline =\nCALCULATE(\n    [Total Sales],\n    Opportunity[IsClosed] = FALSE()\n)</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Opportunity</th><th>Amount</th><th>IsClosed</th></tr></thead><tbody><tr><td>A</td><td>$100K</td><td>TRUE</td></tr><tr><td>B</td><td>$200K</td><td>FALSE</td></tr><tr><td>C</td><td>$150K</td><td>FALSE</td></tr></tbody></table></div>\n<p>Open Pipeline:</p>\n<p>200K + 150K</p>\n<pre class=\"qa-pre\">= $350K</pre>\n<p>However, I would confirm the organization&#x27;s definition of &quot;pipeline&quot; before finalizing the KPI.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon has 1,272 open opportunities. Their unweighted Amount is <strong>$247.48M</strong>; weighted by probability (Expected Amount) it is <strong>$47.88M</strong>. Also note 772 open deals already have a Close Date in the past and 877 are more than a year old, so 'pipeline' needs a hygiene filter too.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "13"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q14. How would you calculate Win Rate?",
"a": "<p>First, I would clarify the business definition.</p>\n<p>One common definition is:</p>\n<pre class=\"qa-pre\">Win Rate =\nDIVIDE(\n    [Closed Won Opportunities],\n    [Closed Won Opportunities]\n        + [Closed Lost Opportunities]\n)</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Closed Won:</p>\n<p>40</p>\n<p>Closed Lost:</p>\n<p>60</p>\n<p>Win Rate:</p>\n<pre class=\"qa-pre\">40 / (40 + 60)\n= 40%</pre>\n<p class=\"qa-label\"><strong>Senior-level answer</strong></p>\n<blockquote>&quot;I would confirm the business definition before implementing the measure because organizations can define win rate using opportunity count, revenue, qualified opportunities or other denominators.&quot;</blockquote><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon: 1,443 won ÷ (1,443 won + 1,931 lost) = <strong>42.77%</strong>. Dividing by all 4,646 opportunities gives a wrong 31.06%, because 1,272 deals are still open. And 419 losses are 'Duplicate opportunity': excluding them the win rate is 48.8%, a definition question to raise with the business.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "14"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q15. Salesforce Opportunity has CreatedDate and CloseDate. Which date would you use?",
"a": "<p>It depends on the KPI.</p>\n<div class=\"qa-table\"><table><thead><tr><th>Business Question</th><th>Date</th></tr></thead><tbody><tr><td>When was the opportunity created?</td><td>CreatedDate</td></tr><tr><td>When did the opportunity close?</td><td>CloseDate</td></tr><tr><td>Sales cycle</td><td>CloseDate - CreatedDate</td></tr><tr><td>Pipeline created during a month</td><td>CreatedDate</td></tr><tr><td>Closed Won sales during a month</td><td>CloseDate</td></tr></tbody></table></div>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Opportunity:</p>\n<ul><li>CreatedDate = January 10</li><li>CloseDate   = March 25</li></ul>\n<p>For:</p>\n<blockquote>&quot;How much pipeline was created in January?&quot;</blockquote>\n<p>Use:</p>\n<p>CreatedDate</p>\n<p>For:</p>\n<blockquote>&quot;How much revenue was closed in March?&quot;</blockquote>\n<p>Use:</p>\n<p>CloseDate</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In AXon, opportunities created in 2021 (711) and opportunities closed in 2021 are different sets: a deal created in 2020 can close in 2021. Pipeline-created charts use Created Date; revenue charts use Close Date.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "15"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q16. How would you calculate sales by Close Date but opportunities by Created Date?",
"a": "<p>I would use a proper Date dimension and role-playing date relationships.</p>\n<p>For example:</p>\n<pre class=\"qa-pre\">                DimDate\n               /       \\\n              /         \\\n     CreatedDate       CloseDate\n          |                |\n          ▼                ▼\n       Opportunity</pre>\n<p>One relationship can be active and the other inactive.</p>\n<p class=\"qa-label\"><strong>Then</strong></p>\n<pre class=\"qa-pre\">Closed Won Sales =\nCALCULATE(\n    [Total Sales],\n    Opportunity[StageName] = &quot;Closed Won&quot;\n)</pre>\n<p>And specifically by Close Date:</p>\n<pre class=\"qa-pre\">Closed Won Sales by Close Date =\nCALCULATE(\n    [Closed Won Sales],\n    USERELATIONSHIP(\n        DimDate[Date],\n        Opportunity[CloseDate]\n    )\n)</pre>\n<p>This allows the same Opportunity table to answer different time-based business questions.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> Same issue in AXon: fact_opportunity has Created Date and Close Date. We keep Close Date active (revenue, win rate) and activate Created Date with USERELATIONSHIP for 'opportunities created' trends.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "16"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q28. What is Weighted Pipeline?",
"a": "<p>Weighted Pipeline estimates potential sales value by applying the probability associated with each opportunity.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Opportunity</th><th>Amount</th><th>Probability</th></tr></thead><tbody><tr><td>A</td><td>$100K</td><td>80%</td></tr><tr><td>B</td><td>$200K</td><td>50%</td></tr></tbody></table></div>\n<p class=\"qa-label\"><strong>Calculation</strong></p>\n<p>A:</p>\n<p>$100K × 80% = $80K</p>\n<p>B:</p>\n<p>$200K × 50% = $100K</p>\n<p class=\"qa-label\"><strong>Total</strong></p>\n<p>$180K</p>\n<p class=\"qa-label\"><strong>DAX</strong></p>\n<pre class=\"qa-pre\">Weighted Pipeline =\nSUMX(\n    Opportunity,\n    Opportunity[Amount] *\n    Opportunity[Probability]\n)</pre><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon's Expected Amount column is exactly Amount × Probability (checked on all 4,022 rows that have both). The weighted pipeline of the 1,272 open deals is <strong>$47.88M</strong> against $247.48M unweighted. Probabilities follow the stage: 5% (Funnel), 10%, 30%, 50%, 70%, 90%.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "28"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q36. How would you calculate Previous Year Sales?",
"a": "<pre class=\"qa-pre\">Sales PY =\nCALCULATE(\n    [Total Sales],\n    SAMEPERIODLASTYEAR(DimDate[Date])\n)</pre>\n<p class=\"qa-label\"><strong>Then YoY</strong></p>\n<pre class=\"qa-pre\">YoY % =\nDIVIDE(\n    [Total Sales] - [Sales PY],\n    [Sales PY]\n)</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Current Year:</p>\n<p>$12M</p>\n<p>Previous Year:</p>\n<p>$10M</p>\n<p>YoY:</p>\n<pre class=\"qa-pre\">(12 - 10) / 10\n= 20%</pre><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon (by Close Date): Won revenue 2020 = $45.48M, 2021 = $41.49M, so YoY = <strong>−8.8%</strong>.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "36"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q37. How would you calculate YTD Sales?",
"a": "<pre class=\"qa-pre\">Sales YTD =\nTOTALYTD(\n    [Total Sales],\n    DimDate[Date]\n)</pre>\n<p>A proper Date table should be used for time-intelligence calculations.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>If today&#x27;s date is June 30:</p>\n<pre class=\"qa-pre\">YTD = January 1 → June 30</pre>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "37"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q38. How would you calculate Average Deal Size?",
"a": "<p>A common definition is:</p>\n<pre class=\"qa-pre\">Average Deal Size =\nDIVIDE(\n    [Total Sales],\n    [Closed Won Opportunities]\n)</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>Closed Won Sales:</p>\n<p>$5,000,000</p>\n<p>Closed Won Opportunities:</p>\n<p>100</p>\n<p>Average Deal Size:</p>\n<p>$5,000,000 / 100</p>\n<pre class=\"qa-pre\">= $50,000</pre>\n<p>Again, I would confirm the business definition—for example, whether the denominator should be all closed opportunities or only Closed Won opportunities.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon: $136.26M ÷ 1,443 won deals = $94,429 if blank amounts count as zero, or <strong>$95,354</strong> over the 1,429 won deals that have an Amount. Pick one definition and write it down. Note the skew: 59 Enterprise deals (>$200K) make up 64.6% of won revenue, so the median deal is much smaller.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "38"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q39. What is Pipeline Coverage?",
"a": "<p>Pipeline Coverage compares available pipeline with the sales target.</p>\n<p class=\"qa-label\"><strong>Formula</strong></p>\n<pre class=\"qa-pre\">Pipeline Coverage =\nOpen Pipeline / Sales Target</pre>\n<p class=\"qa-label\"><strong>DAX</strong></p>\n<pre class=\"qa-pre\">Pipeline Coverage =\nDIVIDE(\n    [Open Pipeline],\n    [Sales Target]\n)</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<ul><li>Open Pipeline = $30M</li><li>Sales Target  = $10M</li></ul>\n<p>Therefore:</p>\n<p>Pipeline Coverage = 3x</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon has no Sales Target table, so pipeline coverage can't be computed from this dataset. To add it, load a target table by rep and quarter and relate it to dim_user and the Date table.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "39"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q40. How would you calculate Salesforce Lead Conversion Rate?",
"a": "<p>First, I would confirm the business definition.</p>\n<p>One possible definition:</p>\n<ul><li>Converted Leads</li><li>--------------------------</li><li>Total Qualified/Created Leads</li></ul>\n<p>But different organizations may define conversion differently.</p>\n<p>For example:</p>\n<p class=\"qa-label\"><strong>Definition A</strong></p>\n<p>Converted Leads / All Leads</p>\n<p class=\"qa-label\"><strong>Definition B</strong></p>\n<p>Converted Leads / Qualified Leads</p>\n<p class=\"qa-label\"><strong>Definition C</strong></p>\n<p>Leads Converted to Opportunities / Leads Created</p>\n<p>Therefore, my interview answer would be:</p>\n<blockquote>&quot;Before implementing the DAX, I would confirm what the business means by Lead Conversion Rate because the denominator can vary depending on whether the organization measures conversion from all created leads, qualified leads or another defined population.&quot;</blockquote>\n<p>This is exactly the type of business-definition clarification emphasized in the source.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon: 1,033 of 10,000 leads converted = <strong>10.33%</strong>. But Lead Status = 'Converted' is set on only 907 rows; the <code>Converted</code> flag is the reliable field. By source, Field Sales converts 28.2% and Website 23.1%, while Inside Sales (the biggest source, 2,786 leads) converts only 1.3%.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "40"
},
{
"cat": "SF+PBI · Modelling & DAX",
"q": "Q43. How would you calculate product-level sales?",
"a": "<p>I would use OpportunityLineItem.</p>\n<p>Conceptually:</p>\n<pre class=\"qa-pre\">Opportunity\n     |\n     | 1 : *\n     ↓\nOpportunityLineItem\n     |\n     ↓\nProduct</pre>\n<p>A common measure would be:</p>\n<pre class=\"qa-pre\">Product Sales =\nSUM(OpportunityLineItem[TotalPrice])</pre>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Product</th><th>Sales</th></tr></thead><tbody><tr><td>Product A</td><td>$100K</td></tr><tr><td>Product B</td><td>$250K</td></tr><tr><td>Product C</td><td>$150K</td></tr></tbody></table></div>\n<p>Total Product Sales:</p>\n<p>$500K</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon product view (Opportunity Product Total Price, all deals): Robot Vacuum $86.13M, Portable Power Bank $61.75M, Organic Cotton T-Shirt $60.86M lead the list across 33 products.</div>",
"signal": "Tests grain, relationships and correct DAX definitions — the most common technical round.",
"n": "43"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q17. Today's Salesforce Opportunity is Closed Won. How do you know what its stage was three months ago?",
"a": "<p>The current Opportunity record may only tell me the current state.</p>\n<p>It does not necessarily provide enough information to reconstruct every historical state.</p>\n<p>For historical analysis, I would use an appropriate Salesforce history source or snapshot strategy.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p>January</p>\n<pre class=\"qa-pre\">Opportunity A → Prospecting\n\nFebruary\nOpportunity A → Qualification\n\nMarch\nOpportunity A → Proposal\n\nApril\nOpportunity A → Closed Won</pre>\n<p>If management asks:</p>\n<blockquote>&quot;What was our pipeline at the end of February?&quot;</blockquote>\n<p>I cannot simply look at today&#x27;s Opportunity Stage.</p>\n<p>I need historical information.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> The AXon export has only the current Stage plus a 'Last Stage Change Date'. There is no OpportunityHistory table, so 'pipeline at end of February' cannot be rebuilt from this data. Say so, and propose snapshots going forward.</div>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "17"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q18. How would you build a historical pipeline dashboard?",
"a": "<p>I would consider a periodic snapshot strategy.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">January 31\n    ↓\nPipeline Snapshot\n\nFebruary 28\n    ↓\nPipeline Snapshot\n\nMarch 31\n    ↓\nPipeline Snapshot\n\nApril 30\n    ↓\nPipeline Snapshot</pre>\n<p>The resulting table might look like:</p>\n<div class=\"qa-table\"><table><thead><tr><th>Snapshot Date</th><th>Opportunity</th><th>Stage</th><th>Amount</th></tr></thead><tbody><tr><td>Jan 31</td><td>O001</td><td>Proposal</td><td>$100K</td></tr><tr><td>Feb 28</td><td>O001</td><td>Negotiation</td><td>$100K</td></tr><tr><td>Mar 31</td><td>O001</td><td>Closed Won</td><td>$100K</td></tr></tbody></table></div>\n<p>Now management can ask:</p>\n<blockquote>&quot;What did the pipeline look like at the end of February?&quot;</blockquote>\n<p>and Power BI can answer using the February snapshot.</p>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "18"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q19. Do Salesforce users' permissions automatically apply to Power BI?",
"a": "<p>I would not assume that they do.</p>\n<p>Salesforce security and Power BI semantic-model security are separate considerations.</p>\n<p>A strong answer is:</p>\n<blockquote>&quot;I would explicitly design and validate Power BI security. I would not assume that Salesforce permissions automatically implement the required Power BI row-level security.&quot;</blockquote>\n<p>For example:</p>\n<pre class=\"qa-pre\">Salesforce Security\n        |\n        | controls Salesforce\n        ↓\nSalesforce Application\n\n\nPower BI Security\n        |\n        | controls semantic model/report\n        ↓\nPower BI</pre>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "19"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q20. Sales representatives should see only their own Salesforce opportunities. How would you implement this?",
"a": "<p>I could implement dynamic Row-Level Security.</p>\n<p>Conceptually:</p>\n<pre class=\"qa-pre\">Power BI User\n     |\n     ↓\nUser Email\n     |\n     ↓\nUser Mapping Table\n     |\n     ↓\nSalesforce User\n     |\n     ↓\nOpportunity Owner</pre>\n<p class=\"qa-label\"><strong>Example mapping table</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Email</th><th>Salesforce User ID</th></tr></thead><tbody><tr><td>john@company.com</td><td>U001</td></tr><tr><td>mary@company.com</td><td>U002</td></tr></tbody></table></div>\n<p>A dynamic RLS rule can use:</p>\n<pre class=\"qa-pre\">[Email] = USERPRINCIPALNAME()</pre>\n<p>The exact implementation depends on how the identity mapping is designed.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In AXon every Opportunity has an Owner ID that matches the User table (98 users, 75 active). The mapping table would be User ID → email, and the RLS rule filters dim_user (and through it fact_opportunity).</div>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "20"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q57. How would you track Opportunity Stage changes?",
"a": "<p>Suppose:</p>\n<p>Opportunity A</p>\n<pre class=\"qa-pre\">January → Prospecting\nFebruary → Qualification\nMarch → Proposal\nApril → Closed Won</pre>\n<p>Management may ask:</p>\n<p>How long did the Opportunity remain in each stage?</p>\n<p>Which stages have the highest drop-off?</p>\n<p>What is the average time to close?</p>\n<p>How quickly do opportunities progress?</p>\n<p>What is the conversion between stages?</p>\n<p>I would need an appropriate historical stage source or history model.</p>\n<p>The analytical model could then look like:</p>\n<pre class=\"qa-pre\">Opportunity\n     |\n     ↓\nStage History\n     |\n     ├── Stage\n     ├── Start Date\n     ├── End Date\n     └── Duration</pre>\n<p>This enables advanced sales-cycle analytics.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon only has the current stage and Last Stage Change Date, so stage duration can't be measured yet. Days to close can: average 99.4 days, median 26, and 244 won deals have a Close Date before their Created Date, a data-entry problem to log.</div>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "57"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q59. Regional managers should only see their own region. How would you implement it?",
"a": "<p>I would use Row-Level Security.</p>\n<p>For example:</p>\n<pre class=\"qa-pre\">User\n |\n ↓\nUser Mapping\n |\n ↓\nRegion\n |\n ↓</pre>\n<p>Opportunity</p>\n<p class=\"qa-label\"><strong>Mapping table</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Email</th><th>Region</th></tr></thead><tbody><tr><td>manager1@company.com</td><td>North</td></tr><tr><td>manager2@company.com</td><td>South</td></tr></tbody></table></div>\n<p>The Power BI model can then dynamically filter data based on the logged-in user.</p>\n<p>For dynamic identity:</p>\n<pre class=\"qa-pre\">[Email] = USERPRINCIPALNAME()</pre><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> The AXon Account and Lead exports have an empty Region column, so regional RLS needs a territory mapping (e.g. Billing State/Country → Region). Billing Country is also inconsistent ('UNITED STATES', 'United States', 'USA'), so clean it first.</div>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "59"
},
{
"cat": "SF+PBI · History & Security (RLS)",
"q": "Q60. Salesforce already has security. Why do you need Power BI RLS?",
"a": "<p>Because the two systems control access at different layers.</p>\n<pre class=\"qa-pre\">Salesforce Security\n        ↓\nSalesforce Data\n\n\nPower BI RLS\n        ↓\nPower BI Semantic Model\n        ↓\nPower BI Report</pre>\n<p>Therefore:</p>\n<blockquote>&quot;I would not assume that Salesforce permissions automatically provide the required security inside Power BI. I would explicitly design and test the Power BI security model.&quot;</blockquote>",
"signal": "Tests history/snapshot thinking and security design.",
"n": "60"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q24. Salesforce has millions of records. Would you directly load everything into Power BI?",
"a": "<p>I would not automatically load everything.</p>\n<p>First I would assess:</p>\n<ul><li>Data volume</li><li>Required history</li><li>Refresh frequency</li><li>Business latency</li><li>API consumption</li><li>Required columns</li><li>Required records</li><li>Data retention</li><li>Performance</li></ul>\n<p>For a large enterprise implementation, I may introduce an intermediate data platform:</p>\n<pre class=\"qa-pre\">Salesforce\n    ↓\nData Extraction\n    ↓\nData Lake / Warehouse\n    ↓\nTransformation\n    ↓\nPower BI</pre>\n<p>This separates source extraction from analytical reporting.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "24"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q25. What problems can Salesforce API limits create?",
"a": "<p>Potential issues include:</p>\n<ul><li>Refresh failures</li><li>Slow extraction</li><li>Excessive API usage</li><li>Too many queries</li><li>Multiple reports extracting the same data</li><li>Increased load on the source system</li></ul>\n<p>For example:</p>\n<pre class=\"qa-pre\">10 Power BI Reports\n       ↓\n10 Independent Salesforce Extractions\n       ↓\nHigh API Consumption</pre>\n<p>Instead, I could consider:</p>\n<pre class=\"qa-pre\">Salesforce\n     ↓\nCentral Extraction\n     ↓\nWarehouse\n     ↓\nMultiple Power BI Reports</pre>\n<p>This can reduce duplicate extraction workloads.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "25"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q26. Power BI refresh is consuming too much Salesforce API capacity. What would you do?",
"a": "<p>I would troubleshoot it systematically.</p>\n<pre class=\"qa-pre\">Reduce unnecessary columns\n        ↓\nReduce unnecessary rows\n        ↓\nReview filters\n        ↓\nReview refresh frequency\n        ↓\nRemove duplicate extraction\n        ↓\nOptimize transformations\n        ↓\nConsider staging/warehouse\n        ↓\nEvaluate incremental strategy</pre>\n<p>I would also determine whether several reports are independently querying Salesforce.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "26"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q29. How would you transform Salesforce data in Power Query?",
"a": "<p>Typical transformations include:</p>\n<ul><li>Remove unnecessary columns</li><li>Rename columns</li><li>Change data types</li><li>Handle nulls</li><li>Remove duplicates where justified</li><li>Merge tables</li><li>Append tables</li><li>Create conditional columns</li><li>Unpivot</li><li>Filter records</li></ul>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">Raw Salesforce Data\n        ↓\nRemove unused fields\n        ↓\nCorrect data types\n        ↓\nHandle nulls\n        ↓\nCreate business columns\n        ↓\nMerge lookup information\n        ↓\nLoad to model</pre>\n<p>The key principle is to perform transformations deliberately rather than changing data simply to make the report work.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "29"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q30. What is the difference between Merge and Append?",
"a": "<p class=\"qa-label\"><strong>Merge</strong></p>\n<p>Merge is conceptually similar to a SQL JOIN.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<p>+</p>\n<p>Opportunity</p>\n<p>using:</p>\n<p>AccountId</p>\n<p>Result:</p>\n<p>Account information + Opportunity information</p>\n<p class=\"qa-label\"><strong>Append</strong></p>\n<p>Append is conceptually similar to a UNION.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<ul><li>Sales_2025</li><li>+</li><li>Sales_2026</li></ul>\n<p>Result:</p>\n<ul><li>Sales_2025</li><li>Sales_2026</li><li>------------</li><li>Combined Sales</li></ul>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "30"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q31. What is Query Folding?",
"a": "<p>Query folding means Power Query pushes supported transformations back to the source rather than processing everything locally.</p>\n<p>Conceptually:</p>\n<pre class=\"qa-pre\">Power BI\n   |\n   | &quot;Filter records where Stage = Closed Won&quot;\n   ↓\nSource System\n   |\n   | Executes filtering\n   ↓\nOnly required data returned</pre>\n<p>This can reduce:</p>\n<ul><li>Data movement</li><li>Processing</li><li>Refresh time</li></ul>\n<p>However, the exact folding behaviour depends on the source and transformation.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "31"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q32. Should Salesforce data use Import or DirectQuery?",
"a": "<p>I would not automatically choose one.</p>\n<p>I would evaluate:</p>\n<ul><li>Data volume</li><li>Required latency</li><li>Refresh requirements</li><li>Source capabilities</li><li>Performance</li><li>API considerations</li><li>Architecture</li><li>Security</li></ul>\n<p>For example:</p>\n<pre class=\"qa-pre\">Salesforce\n     ↓\nPower BI Import\n     ↓\nScheduled Refresh</pre>\n<p>could be appropriate for many reporting scenarios.</p>\n<p>For a larger enterprise architecture:</p>\n<pre class=\"qa-pre\">Salesforce\n     ↓\nData Lake / Warehouse\n     ↓\nPower BI</pre>\n<p>may provide better separation between operational CRM and analytical workloads.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "32"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q33. How would you configure a daily Salesforce refresh?",
"a": "<p>In Power BI Service:</p>\n<pre class=\"qa-pre\">Workspace\n   ↓\nSemantic Model\n   ↓\nSettings\n   ↓\nScheduled Refresh</pre>\n<p>Then configure:</p>\n<ul><li>Credentials</li><li>Refresh schedule</li><li>Time</li><li>Failure notifications</li></ul>\n<p>I would also validate that the Salesforce authentication and integration permissions are correctly configured.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "33"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q34. Power BI refresh failed. How would you troubleshoot it?",
"a": "<p>I would follow a structured approach:</p>\n<pre class=\"qa-pre\">Refresh History\n      ↓\nError Message\n      ↓\nCredentials\n      ↓\nSalesforce Authentication\n      ↓\nAPI / Access\n      ↓\nSchema Changes\n      ↓\nData Type Changes\n      ↓\nPower Query Errors\n      ↓\nGateway if applicable\n      ↓\nSemantic Model</pre>\n<p>I would first identify the exact failing step instead of making random changes.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "34"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q35. Salesforce admin renamed/deleted a field and Power BI refresh failed. What would you do?",
"a": "<p>First I would identify the failing Power Query step.</p>\n<p class=\"qa-label\"><strong>Then</strong></p>\n<p>Check the current Salesforce schema.</p>\n<p>Compare it with the Power BI query.</p>\n<p>Identify the removed/renamed field.</p>\n<p>Determine whether the change was intentional.</p>\n<p>Update Power Query if required.</p>\n<p>Check dependent DAX measures.</p>\n<p>Check visuals.</p>\n<p>Refresh and validate.</p>\n<p>Document the change.</p>\n<p>For example:</p>\n<p>Salesforce</p>\n<p>Old:</p>\n<p>Sales_Region__c</p>\n<p>New:</p>\n<p>Region__c</p>\n<p>If Power Query expects:</p>\n<p>Sales_Region__c</p>\n<p>the refresh may fail.</p>\n<p>I would update the query based on the approved business definition rather than simply replacing the column blindly.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "35"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q52. Salesforce API access error is occurring. What would you check?",
"a": "<p>I would check:</p>\n<pre class=\"qa-pre\">User Permissions\n       ↓\nAPI Enabled\n       ↓\nAuthentication\n       ↓\nSalesforce Session Settings\n       ↓\nAPI Version\n       ↓\nConnector Configuration</pre>\n<p>I would also inspect the exact connector error rather than assuming it is an API-limit problem.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "52"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q53. What is Salesforce API version and why is it important for Power BI?",
"a": "<p>Power BI&#x27;s Salesforce connector communicates with Salesforce through a supported API version.</p>\n<p>If the configured API version is unsupported, the connection can fail.</p>\n<p>Therefore, if I encounter an API-version-related error, I would verify:</p>\n<ul><li>Salesforce supported API version</li><li>Connector configuration</li><li>Power BI connector version/capability</li><li>Authentication</li><li>Salesforce environment</li></ul>\n<p>A strong interview answer:</p>\n<blockquote>&quot;The Salesforce API version determines the API interface that the connector communicates with. I would make sure the configured version is supported by the Salesforce environment and compatible with the Power BI connector.&quot;</blockquote>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "53"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q55. Salesforce has 500,000 opportunities and Power BI refresh is slow. What would you do?",
"a": "<p>My approach would be:</p>\n<pre class=\"qa-pre\">500K Opportunities\n        ↓\nCheck required history\n        ↓\nRemove unnecessary fields\n        ↓\nFilter unnecessary records\n        ↓\nReview transformations\n        ↓\nCheck API usage\n        ↓\nCheck refresh frequency\n        ↓\nEvaluate staging/warehouse\n        ↓\nOptimize Power BI model</pre>\n<p>I would also determine whether the report really needs all 500,000 records.</p>\n<p>For example, if the report only needs:</p>\n<p>Current Year</p>\n<p>there may be no reason to extract historical data going back ten years into the report model.</p>\n<p>For enterprise implementations, I would consider:</p>\n<pre class=\"qa-pre\">Salesforce\n     ↓\nData Warehouse\n     ↓\nPower BI</pre>\n<p>rather than placing the entire extraction burden on the report.</p>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "55"
},
{
"cat": "SF+PBI · Power Query, Refresh & API",
"q": "Q56. Salesforce Report contains 100,000 records but Power BI shows only 2,000. Why?",
"a": "<p>So if a Salesforce report contains:</p>\n<p>100,000 records</p>\n<p>but Power BI receives:</p>\n<p>2,000 records</p>\n<p>I would investigate the connector being used.</p>\n<p>One potential solution is to evaluate:</p>\n<p>Salesforce Objects</p>\n<p>instead of relying on the Salesforce Reports connector for that use case.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon avoided this by working from full object exports (CSV/XLSX per object) loaded into Snowflake, not from Salesforce reports.</div>",
"signal": "Tests production readiness: refresh, API limits, schema changes.",
"n": "56"
},
{
"cat": "SF+PBI · Reconciliation & Data Quality",
"q": "Q21. Salesforce says Closed Won = $10M, but Power BI says $9.5M. How do you troubleshoot?",
"a": "<p>This is one of the most important real-world interview scenarios.</p>\n<p>I would not immediately assume that the DAX is wrong.</p>\n<p>I would systematically investigate:</p>\n<p class=\"qa-label\"><strong>1. Refresh timestamp</strong></p>\n<p>Are Salesforce and Power BI using the same data refresh point?</p>\n<p class=\"qa-label\"><strong>2. Date filter</strong></p>\n<p>Are both systems using the same date range?</p>\n<p class=\"qa-label\"><strong>3. Date field</strong></p>\n<p>Is Salesforce using CloseDate while Power BI is using CreatedDate?</p>\n<p class=\"qa-label\"><strong>4. Stage definition</strong></p>\n<p>Are both using the same definition of Closed Won?</p>\n<p class=\"qa-label\"><strong>5. Deleted records</strong></p>\n<p>Could deleted records be handled differently?</p>\n<p class=\"qa-label\"><strong>6. Currency</strong></p>\n<p>Are all amounts converted using the same currency logic?</p>\n<p class=\"qa-label\"><strong>7. Duplicate rows</strong></p>\n<p>Did a relationship create duplication?</p>\n<p class=\"qa-label\"><strong>8. OpportunityLineItem</strong></p>\n<p>Did joining line items duplicate Opportunity Amount?</p>\n<p class=\"qa-label\"><strong>9. Null values</strong></p>\n<p>Are some Opportunity Amounts missing?</p>\n<p class=\"qa-label\"><strong>10. Permissions</strong></p>\n<p>Did the Power BI extraction user have access to all required records?</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> A real AXon example of 'Power BI is lower': if your model inner-joins Opportunity to Account, the 123 opportunities whose Account ID is missing from the Account export disappear from every total. A higher number usually means the line-item duplication from Q10.</div>",
"signal": "Tests structured reconciliation, the skill that separates analysts from report builders.",
"n": "21"
},
{
"cat": "SF+PBI · Reconciliation & Data Quality",
"q": "Q44. Salesforce Amount is null. What would you do?",
"a": "<p>I would not automatically replace null with zero.</p>\n<p>First I would understand why it is null.</p>\n<p>Possible reasons:</p>\n<ul><li>Incomplete Opportunity</li><li>Data-entry issue</li><li>Business process</li><li>Integration issue</li><li>Amount not applicable at that stage</li></ul>\n<p>Then I would agree with the business on the correct treatment.</p>\n<p>For example:</p>\n<p>NULL</p>\n<p>does not necessarily mean:</p>\n<p>$0</p>\n<p>That distinction can materially affect reporting.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon: 474 of 4,646 opportunities have a blank Amount (14 of them are Closed Won) and 624 have a blank Expected Amount. We keep them blank, flag them in the Data Quality Log, and show the count on the QA page instead of turning them into $0.</div>",
"signal": "Tests structured reconciliation, the skill that separates analysts from report builders.",
"n": "44"
},
{
"cat": "SF+PBI · Reconciliation & Data Quality",
"q": "Q48. Salesforce revenue and ERP revenue don't match. What would you do?",
"a": "<p>I would first establish the source-of-truth definition.</p>\n<p>Salesforce may represent:</p>\n<p>Closed Won Opportunity Amount</p>\n<p>while ERP may represent:</p>\n<p>Invoiced Revenue</p>\n<p>These are not necessarily the same metric.</p>\n<p>I would investigate:</p>\n<pre class=\"qa-pre\">Salesforce Closed Won\n        vs\nERP Invoiced Revenue</pre>\n<p>Potential differences:</p>\n<ul><li>Timing</li><li>Currency</li><li>Cancellations</li><li>Returns</li><li>Credit notes</li><li>Opportunity amount vs invoice amount</li><li>Customer ID mapping</li><li>Fiscal calendar</li><li>Data refresh timing</li></ul>\n<p>The correct approach is reconciliation based on agreed business definitions rather than simply forcing the two numbers to match.</p>",
"signal": "Tests structured reconciliation, the skill that separates analysts from report builders.",
"n": "48"
},
{
"cat": "SF+PBI · Reconciliation & Data Quality",
"q": "Q49. Salesforce has multiple currencies. How would you handle them?",
"a": "<p>I would first understand:</p>\n<ul><li>Transaction currency</li><li>Corporate currency</li><li>Exchange rate</li><li>Reporting currency</li><li>Conversion date</li><li>Whether historical exchange rates are required</li></ul>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<ul><li>Opportunity A</li><li>USD 100,000</li></ul>\n<ul><li>Opportunity B</li><li>EUR 100,000</li></ul>\n<p>I should not simply calculate:</p>\n<pre class=\"qa-pre\">100,000 + 100,000\n= 200,000</pre>\n<p>because the currencies are different.</p>\n<p>I need a consistent reporting currency.</p>\n<p>For example:</p>\n<pre class=\"qa-pre\">Transaction Currency\n        ↓\nExchange Rate\n        ↓\nReporting Currency</pre><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> The AXon export has a single currency (USD, '$' in the Amount text), so no conversion is needed here. In Staging we still strip '$' and ',' from Amount before casting it to a number.</div>",
"signal": "Tests structured reconciliation, the skill that separates analysts from report builders.",
"n": "49"
},
{
"cat": "SF+PBI · Reconciliation & Data Quality",
"q": "Q50. Business fiscal year is April–March. How would you handle it in Power BI?",
"a": "<p>I would create a proper Date dimension with fiscal attributes.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Date</th><th>Calendar Year</th><th>Calendar Month</th><th>Fiscal Year</th><th>Fiscal Month</th></tr></thead><tbody><tr><td>Apr 2026</td><td>2026</td><td>Apr</td><td>FY2026-27</td><td>1</td></tr><tr><td>May 2026</td><td>2026</td><td>May</td><td>FY2026-27</td><td>2</td></tr><tr><td>Mar 2027</td><td>2027</td><td>Mar</td><td>FY2026-27</td><td>12</td></tr></tbody></table></div>\n<p>The Date dimension could contain:</p>\n<ul><li>Date</li><li>Calendar Year</li><li>Calendar Month</li><li>Calendar Quarter</li><li>Fiscal Year</li><li>Fiscal Quarter</li><li>Fiscal Month</li></ul>\n<p>Then all fiscal reporting can use these attributes.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In AXon, Salesforce's Fiscal Year equals the calendar year of Close Date for every row, so the org uses a Jan–Dec fiscal year. If the business moves to Apr–Mar, only the Date table changes.</div>",
"signal": "Tests structured reconciliation, the skill that separates analysts from report builders.",
"n": "50"
},
{
"cat": "SF+PBI · Reconciliation & Data Quality",
"q": "Q51. Salesforce says ₹10 crore, Power BI says ₹9.7 crore. What do you check?",
"a": "<p>I would use a structured reconciliation checklist.</p>\n<p class=\"qa-label\"><strong>Step 1 — Date range</strong></p>\n<p>Are both systems using exactly the same period?</p>\n<p class=\"qa-label\"><strong>Step 2 — Time zone</strong></p>\n<p>Could records around midnight be assigned to different dates?</p>\n<p class=\"qa-label\"><strong>Step 3 — Currency</strong></p>\n<p>Are the same currency and exchange-rate rules being used?</p>\n<p class=\"qa-label\"><strong>Step 4 — Filters</strong></p>\n<p>Are Salesforce and Power BI applying the same filters?</p>\n<p class=\"qa-label\"><strong>Step 5 — Stage</strong></p>\n<p>Are both using the same definition of Closed Won?</p>\n<p class=\"qa-label\"><strong>Step 6 — Deleted records</strong></p>\n<p>Are deleted Salesforce records being treated differently?</p>\n<p class=\"qa-label\"><strong>Step 7 — Duplicate records</strong></p>\n<p>Could Power BI relationships be duplicating values?</p>\n<p class=\"qa-label\"><strong>Step 8 — Null Amount</strong></p>\n<p>Are some records missing amounts?</p>\n<p class=\"qa-label\"><strong>Step 9 — Refresh timestamp</strong></p>\n<p>Is Power BI using stale data?</p>\n<p class=\"qa-label\"><strong>Step 10 — Extraction completeness</strong></p>\n<p>Did all expected Salesforce records reach Power BI?</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> In AXon the most common real causes are the 123 orphan Account IDs (inner join drops them), the 14 won deals with blank Amount, and Close Dates far in the future (13 deals close after 2022, one in 2030).</div>",
"signal": "Tests structured reconciliation, the skill that separates analysts from report builders.",
"n": "51"
},
{
"cat": "SF+PBI · Dashboards & Performance",
"q": "Q27. Which Salesforce objects would you use for a Sales Dashboard?",
"a": "<p>I would commonly evaluate:</p>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<pre class=\"qa-pre\">Opportunity\nOpportunityLineItem\nProduct\nUser</pre>\n<p class=\"qa-label\"><strong>Lead</strong></p>\n<p>Campaign</p>\n<p>The actual objects depend on the business requirements.</p>\n<p>For example:</p>\n<p>Revenue dashboard</p>\n<pre class=\"qa-pre\">Opportunity\nOpportunityLineItem\nProduct</pre>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<ul><li>User</li><li>Date</li><li>Lead conversion dashboard</li></ul>\n<p class=\"qa-label\"><strong>Lead</strong></p>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<p class=\"qa-label\"><strong>Contact</strong></p>\n<pre class=\"qa-pre\">Opportunity\nCampaign\nSales representative dashboard\nUser</pre>\n<p>Opportunity</p>\n<p class=\"qa-label\"><strong>Account</strong></p>\n<p>OpportunityLineItem</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon's Lead Analytics Dashboard uses Lead (+ Account for industry); the Opportunity Performance Dashboard uses Opportunity, Opportunity Product, Account and User.</div>",
"signal": "Tests dashboard design and performance troubleshooting.",
"n": "27"
},
{
"cat": "SF+PBI · Dashboards & Performance",
"q": "Q45. How would you design a Sales Leadership Dashboard?",
"a": "<p>I would organize the dashboard around the questions leadership needs to answer.</p>\n<p class=\"qa-label\"><strong>Page 1 — Executive Overview</strong></p>\n<p>KPIs:</p>\n<ul><li>Revenue</li><li>Closed Won</li><li>Open Pipeline</li><li>Win Rate</li><li>Target Achievement</li><li>YoY Growth</li></ul>\n<p class=\"qa-label\"><strong>Page 2 — Pipeline</strong></p>\n<p>Visuals:</p>\n<ul><li>Pipeline by Stage</li><li>Pipeline by Region</li><li>Pipeline by Sales Rep</li><li>Pipeline Aging</li></ul>\n<p class=\"qa-label\"><strong>Page 3 — Sales Performance</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Sales Rep</th><th>Target</th><th>Actual</th><th>Achievement %</th><th>Pipeline</th><th>Win Rate</th></tr></thead><tbody></tbody></table></div>\n<p class=\"qa-label\"><strong>Page 4 — Product</strong></p>\n<ul><li>Product Revenue</li><li>Product Growth</li><li>Units</li><li>Average Deal Size</li></ul>\n<p class=\"qa-label\"><strong>Page 5 — Account</strong></p>\n<ul><li>Top Accounts</li><li>New Accounts</li><li>Revenue</li><li>Open Opportunities</li></ul><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> Our two AXon dashboards follow this idea: Lead Analytics (marketing) and Opportunity Performance (sales leadership), each with KPI cards on top and drill-downs below.</div>",
"signal": "Tests dashboard design and performance troubleshooting.",
"n": "45"
},
{
"cat": "SF+PBI · Dashboards & Performance",
"q": "Q46. CEO says, \"Sales is down.\" What do you do?",
"a": "<p>I would not immediately create a chart.</p>\n<p>First I would clarify:</p>\n<blockquote>&quot;When you say sales, do you mean bookings, revenue, Closed Won Opportunity Amount, or invoiced revenue?&quot;</blockquote>\n<p>Then I would break down the problem.</p>\n<pre class=\"qa-pre\">Sales Down\n    |\n    ├── Volume?\n    |\n    ├── Average Deal Size?\n    |\n    ├── Win Rate?\n    |\n    ├── Pipeline?\n    |\n    ├── Region?\n    |\n    ├── Product?\n    |\n    └── Sales Rep?</pre>\n<p>For example:</p>\n<p>If revenue is down 10%, I would determine whether:</p>\n<pre class=\"qa-pre\">Number of Deals ↓\n        OR\nAverage Deal Size ↓\n        OR\nWin Rate ↓\n        OR\nPipeline ↓\n        OR\nSpecific Region ↓</pre>\n<p>This demonstrates analytical thinking rather than simply building visuals.</p><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> <strong>AXon example:</strong> Won revenue fell from $45.48M (2020) to $41.49M (2021), −8.8%. Decomposed: won deals dropped from 445 to 294 (−34%), but average deal size rose from $102K to $142K and win rate improved from 42.0% to 45.9%. So it's a <em>volume</em> problem (fewer deals reaching close: 1,059 → 640), not a selling problem.</div>",
"signal": "Tests dashboard design and performance troubleshooting.",
"n": "46"
},
{
"cat": "SF+PBI · Dashboards & Performance",
"q": "Q47. Salesforce already has dashboards. Why would you use Power BI?",
"a": "<p>I would explain that both platforms can serve different analytical purposes.</p>\n<p>Salesforce dashboards are useful for operational CRM reporting.</p>\n<p>Power BI becomes particularly useful when the organization needs:</p>\n<ul><li>Cross-source analytics</li><li>Enterprise semantic modelling</li><li>Advanced DAX</li><li>Complex transformations</li><li>Combining CRM with ERP</li><li>Finance integration</li><li>Marketing integration</li><li>Advanced visualization</li><li>Reusable analytical models</li></ul>\n<p>For example:</p>\n<pre class=\"qa-pre\">Salesforce\n      +\nERP\n      +\nFinance\n      +\nMarketing\n      +\nExcel\n      ↓\n   Power BI</pre>\n<p>This allows management to analyse Salesforce performance together with financial and operational information.</p>",
"signal": "Tests dashboard design and performance troubleshooting.",
"n": "47"
},
{
"cat": "SF+PBI · Dashboards & Performance",
"q": "Q54. Salesforce dashboard takes 30–40 seconds to load. What would you do?",
"a": "<p>I would troubleshoot at multiple layers.</p>\n<p class=\"qa-label\"><strong>1. Data model</strong></p>\n<p>Check:</p>\n<ul><li>Number of tables</li><li>Relationship complexity</li><li>Cardinality</li><li>Many-to-many relationships</li></ul>\n<p class=\"qa-label\"><strong>2. DAX</strong></p>\n<p>Identify expensive measures.</p>\n<p class=\"qa-label\"><strong>3. Visuals</strong></p>\n<p>Check how many visuals are loading simultaneously.</p>\n<p class=\"qa-label\"><strong>4. Performance Analyzer</strong></p>\n<p>Use Power BI Performance Analyzer to identify slow visuals.</p>\n<p class=\"qa-label\"><strong>5. Data volume</strong></p>\n<p>Remove unnecessary columns and rows.</p>\n<p class=\"qa-label\"><strong>6. Power Query</strong></p>\n<p>Optimize transformations.</p>\n<p class=\"qa-label\"><strong>7. Source extraction</strong></p>\n<p>Check whether excessive Salesforce data is being brought into the model.</p>\n<p class=\"qa-label\"><strong>8. Aggregation</strong></p>\n<p>Consider pre-aggregation when appropriate.</p>\n<p class=\"qa-label\"><strong>Architecture</strong></p>\n<pre class=\"qa-pre\">Source\n  ↓\nExtraction\n  ↓\nTransformation\n  ↓\nModel\n  ↓\nDAX\n  ↓\nVisual</pre>\n<p>I would determine which layer is causing the bottleneck before changing the architecture.</p>",
"signal": "Tests dashboard design and performance troubleshooting.",
"n": "54"
},
{
"cat": "SF+PBI · Dashboards & Performance",
"q": "Q58. How would you build a Sales Rep Performance Dashboard?",
"a": "<p>I would create a model where Sales Rep is connected to Opportunity ownership.</p>\n<p class=\"qa-label\"><strong>Example</strong></p>\n<pre class=\"qa-pre\">DimSalesRep\n     |\n     ↓\nFactOpportunity\n     |\n     ├── Pipeline\n     ├── Closed Won\n     ├── Win Rate\n     ├── Average Deal\n     └── Sales Cycle</pre>\n<p class=\"qa-label\"><strong>Dashboard</strong></p>\n<div class=\"qa-table\"><table><thead><tr><th>Sales Rep</th><th>Target</th><th>Actual</th><th>Achievement</th><th>Pipeline</th><th>Win Rate</th></tr></thead><tbody><tr><td>John</td><td>$2M</td><td>$1.8M</td><td>90%</td><td>$3M</td><td>35%</td></tr><tr><td>Mary</td><td>$2M</td><td>$2.2M</td><td>110%</td><td>$4M</td><td>42%</td></tr></tbody></table></div><div class=\"qa-axon\">🔎 <strong>In the AXon project data:</strong> AXon top reps by won revenue: Jonathan Patterson $38.9M, Liam Smith $24.18M, Emma Brown $11.43M. By win rate (50+ closed deals): Benjamin Young 74.8%, Lucas Lee 64.9%. Show both: the biggest revenue rep isn't the best closer.</div>",
"signal": "Tests dashboard design and performance troubleshooting.",
"n": "58"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 1: Salesforce has 500,000 opportunities and Power BI refresh is slow. What do you do?",
"a": "<p><strong>Short answer:</strong> Start by checking what the report actually needs (columns, years of history), cut columns and rows at the source, review refresh frequency and API usage, then move heavy extraction into a staging warehouse (in AXon: Snowflake) so Power BI only imports clean mart views.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>Data volume</li><li>Required columns</li><li>Required history</li><li>API usage</li><li>Refresh frequency</li><li>Model optimization</li><li>Warehouse/staging</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q55</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S1"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 2: Salesforce report returns only 2,000 records. Why?",
"a": "<p><strong>Short answer:</strong> The Salesforce Reports connector has a 2,000-row limit. Switch to the Salesforce Objects connector (or a warehouse extract) for full data, and confirm the row count matches Salesforce.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<p>Salesforce Reports connector</p>\n<pre class=\"qa-pre\">2,000-row limitation\nSalesforce Objects\nAlternative architecture</pre><p class=\"qa-ref\">📌 Full worked answer: <strong>Q56</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S2"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 3: Salesforce field was renamed and Power BI refresh failed.",
"a": "<p><strong>Short answer:</strong> Find the failing Power Query step, compare the current Salesforce schema (API names) with the query, update the column reference after confirming the business meaning, then check every DAX measure and visual that used it, and document the change.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>Power Query error</li><li>Schema comparison</li><li>API names</li><li>Downstream DAX</li><li>Visual dependencies</li><li>Governance</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q35</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S3"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 4: CEO says Power BI pipeline is incorrect compared with Salesforce.",
"a": "<p><strong>Short answer:</strong> Compare definitions before numbers: refresh time, filters, date field (Created vs Close), stage definition, duplicates from line items, deleted records, currency, and whether all records were extracted.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<p>Same refresh time?</p>\n<p>Same filters?</p>\n<p>Same date?</p>\n<p>Same stage?</p>\n<p>Duplicate records?</p>\n<p>Deleted records?</p>\n<p>Currency?</p>\n<p>Data completeness?</p><p class=\"qa-ref\">📌 Full worked answer: <strong>Q21</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S4"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 5: Regional managers should see only their region.",
"a": "<p><strong>Short answer:</strong> Dynamic RLS: a mapping table (email → region), USERPRINCIPALNAME() in the role, the region dimension filtering the facts, and testing with 'View as role' for several users.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>RLS</li><li>User mapping</li><li>USERPRINCIPALNAME()</li><li>Region dimension</li><li>Security testing</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q59</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S5"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 6: Management wants pipeline as of every month-end.",
"a": "<p><strong>Short answer:</strong> Current-state data can't show the past. Take a month-end snapshot of all open opportunities (or use opportunity history) and report from the snapshot table.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>Current-state data is insufficient</li><li>Opportunity history</li><li>Snapshot strategy</li><li>Month-end snapshots</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q18</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S6"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 7: Salesforce revenue doesn't match ERP revenue.",
"a": "<p><strong>Short answer:</strong> Salesforce Closed Won is a booking; ERP revenue is invoiced. Agree the source of truth, then reconcile timing, currency, cancellations, credit notes and customer ID mapping.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>Closed Won vs invoiced revenue</li><li>Source of truth</li><li>Timing</li><li>Currency</li><li>Returns</li><li>Credit notes</li><li>Customer mapping</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q48</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S7"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 8: Opportunity has CreatedDate, CloseDate and Stage History. How would you model it?",
"a": "<p><strong>Short answer:</strong> One Date table with two roles (Created Date and Close Date, one inactive relationship + USERELATIONSHIP), a fact_opportunity at opportunity grain, and a separate stage-history fact (one row per stage change with start and end dates).</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<pre class=\"qa-pre\">DimDate\n   |\n   ├── CreatedDate\n   └── CloseDate\n\nFactOpportunity\n      |\n      ↓\nFactOpportunityStageHistory</pre><p class=\"qa-ref\">📌 Full worked answer: <strong>Q16 / Q57</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S8"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 9: One sales rep can see another sales rep's data.",
"a": "<p><strong>Short answer:</strong> Check the RLS role filter, the user-mapping table, relationship direction from the security table to the facts, role membership in the Service, and test with the exact user's effective identity.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>RLS configuration</li><li>User mapping</li><li>Relationships</li><li>Security role</li><li>Test user</li><li>Effective identity</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q20</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S9"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "Scenario 10: Dashboard takes 30–40 seconds to load.",
"a": "<p><strong>Short answer:</strong> Use Performance Analyzer to find the slow layer: DAX, model (relationships, high-cardinality columns), number of visuals, Power Query, or source extraction. Fix that layer first; consider aggregations.</p><p class=\"qa-label\"><strong>Discuss</strong></p>\n<ul><li>Performance Analyzer</li><li>DAX</li><li>Model</li><li>Relationships</li><li>High cardinality</li><li>Visual count</li><li>Power Query</li><li>Source extraction</li><li>Aggregation</li></ul><p class=\"qa-ref\">📌 Full worked answer: <strong>Q54</strong> in this tab.</p>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "S10"
},
{
"cat": "SF+PBI · Scenarios & Project Story",
"q": "How do you explain your Salesforce + Power BI project in an interview?",
"a": "<p>This is one answer I would strongly recommend practicing:</p>\n<blockquote>&quot;I worked on a Power BI sales analytics solution using Salesforce as the primary CRM source. I identified the required Salesforce objects, such as Account, Opportunity, OpportunityLineItem, Product and User, and extracted the required data into Power BI.</blockquote>\n<p>I used Power Query for data transformation and cleansing and designed a dimensional model with Opportunity as the primary transactional entity and dimensions such as Account, Product, Sales Representative and Date.</p>\n<p>I developed DAX measures for key sales KPIs such as Closed Won Revenue, Open Pipeline, Win Rate, Weighted Pipeline, Average Deal Size, Target Achievement and Year-over-Year Growth.</p>\n<p>I also considered Salesforce-specific requirements such as custom objects, API consumption, deleted records, schema changes, multi-currency and historical Opportunity data.</p>\n<p>For security, I implemented the appropriate Power BI Row-Level Security based on the business requirement. I published the report to Power BI Service and configured the required refresh process.</p>\n<p>Finally, I validated the Power BI results against Salesforce by reconciling filters, dates, currencies, stages, record counts and data refresh timestamps.&quot;</p>\n<p>That answer demonstrates the complete lifecycle:</p>\n<pre class=\"qa-pre\">Salesforce\n    ↓\nData Extraction\n    ↓\nPower Query\n    ↓\nData Model\n    ↓\nDAX\n    ↓\nVisualization\n    ↓\nRLS\n    ↓\nPower BI Service\n    ↓\nRefresh\n    ↓\nValidation</pre>",
"signal": "Scenario round: structure your answer, then go deep.",
"n": "PROJ"
}
];
QA_CATS.push(...SF_QA_CATS);
QA.push(...SF_QA);
/* attach official sources to the Salesforce connector questions (runs after 026) */
// attach official sources to the connector questions
QA.forEach(q => {
  if (/^Q(2|3|56)\./.test(q.q)) q.src = SRC.sfr;
  else if (/^Q(1|22|23|52|53)\./.test(q.q)) q.src = SRC.sfo;
  else if (/^Q(8|9|10)\./.test(q.q)) q.src = SRC.star;
  else if (/^Q16\./.test(q.q)) q.src = SRC.ur;
});
/* ============================================================
   Helpers
   ============================================================ */
const CHART_COLORS = ["#1677D2", "#F59E0B", "#22C3EE", "#7C3AED", "#16A34A", "#DC2626", "#5B6472", "#0EA5E9"];
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; }
function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function slugify(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60); }
function copyText(text, btn, label) {
  const done = () => { if (btn) { const o = label || btn.textContent; btn.textContent = "✓ Copied"; setTimeout(() => { btn.textContent = o; }, 1500); } };
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  else fallbackCopy(text, done);
}
function fallbackCopy(text, cb) {
  const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
  document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); if (cb) cb();
}

/* ---------------- Storage (never throws) ---------------- */
const STORE_KEY = "axon_crm_state_v1";
let __memState = null;
function loadState() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(STORE_KEY)); } catch (e) {}
  if (!s) s = __memState;
  s = s || {};
  ["journey", "deliv", "assign", "lab", "qa", "qachk", "recon", "pitch"].forEach(k => { if (!s[k]) s[k] = {}; });
  return s;
}
function saveState(s) { __memState = s; try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {} }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

/* ---------------- Charts (native SVG / CSS) ---------------- */
function svgDonut(data, size) {
  size = size || 120;
  const total = data.reduce((s, d) => s + Math.abs(d[1]), 0);
  const r = size / 2 - 10, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let off = 0, circles = "";
  data.forEach((d, i) => {
    const dash = total ? (Math.abs(d[1]) / total) * C : 0;
    circles += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${CHART_COLORS[i % CHART_COLORS.length]}" stroke-width="16" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-off}" transform="rotate(-90 ${cx} ${cy})"/>`;
    off += dash;
  });
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img">${circles}</svg>`;
}
function renderDonutBlock(chart) {
  const data = chart.data || [];
  const total = data.reduce((s, d) => s + d[1], 0);
  const legend = data.map((d, i) => `<div class="li"><span class="sw" style="background:${CHART_COLORS[i % CHART_COLORS.length]}"></span>${esc(d[0])}: ${Number(d[1]).toLocaleString("en-IN")} (${total ? ((d[1] / total) * 100).toFixed(1) : "0.0"}%)</div>`).join("");
  return `<div class="mock-chart"><div class="ct">${esc(chart.title)}</div><div class="donut-wrap">${svgDonut(data)}<div class="mock-legend">${legend}</div></div></div>`;
}
function renderBarBlock(chart, opts) {
  const data = chart.data || [];
  const max = Math.max(...data.map(d => Math.abs(d[1])), 0);
  const suffix = chart.suffix || "", prefix = chart.prefix || "";
  const base = opts && opts.base;
  const rows = data.map((d, i) => {
    const pct = max ? (Math.abs(d[1]) / max) * 100 : 0;
    const hiC = opts && opts.goodHigh ? "#16A34A" : "#DC2626", loC = opts && opts.goodHigh ? "#DC2626" : "#16A34A";
    const color = base !== undefined ? (d[1] > base * 1.15 ? hiC : d[1] < base * 0.85 ? loC : "#1677D2") : (d[1] < 0 ? "#DC2626" : CHART_COLORS[i % CHART_COLORS.length]);
    const extra = d[2] !== undefined ? ` <span style="color:var(--ink-muted);font-size:10.5px;">n=${d[2]}</span>` : "";
    return `<div class="bar-row"><div class="lab">${esc(d[0])}</div><div class="track"><div class="fill" style="width:${pct}%;background:${color}"></div></div><div class="val">${prefix}${Number(d[1]).toLocaleString("en-IN")}${suffix}${extra}</div></div>`;
  }).join("");
  return `<div class="mock-chart"><div class="ct">${esc(chart.title)}</div>${rows}</div>`;
}
function renderDashMock(d) {
  const kpis = d.kpis.map(k => `<div class="mock-kpi"><div class="v">${k.v}</div><div class="l">${esc(k.l)}</div></div>`).join("");
  const donuts = (d.donuts || []).map(c => renderDonutBlock(c)).join("");
  const bars = (d.bars || []).map(c => renderBarBlock(c)).join("");
  return `<div class="card dash-mock"><div class="mock-head"><h4>${esc(d.title)}</h4><p>${esc(d.sub)}</p></div><div class="mock-kpis">${kpis}</div><div class="mock-charts">${donuts}${bars}</div></div>`;
}

/* ============================================================
   Progress engine
   ============================================================ */
const TRACKS = [
  { id: "business", name: "Business Understanding" }, { id: "model", name: "Data Model & Quality" }, { id: "sql", name: "SQL" },
  { id: "kpi", name: "KPIs" }, { id: "excel", name: "Excel" }, { id: "tableau", name: "Tableau" }, { id: "powerbi", name: "Power BI" },
  { id: "qa", name: "QA" }, { id: "interview", name: "Interview" }, { id: "career", name: "Insights & Career" },
];
function trackScores() {
  const s = loadState();
  const sc = {}; TRACKS.forEach(t => sc[t.id] = [0, 0]);
  JOURNEY.forEach(j => { sc[j.track][1]++; if (s.journey[j.id]) sc[j.track][0]++; });
  DELIVERABLES.forEach(d => { sc[d.track][1]++; if (s.deliv[d.id]) sc[d.track][0]++; });
  assignments().forEach(a => { sc[a.track][1]++; if (s.assign[a.id] && s.assign[a.id].ok) sc[a.track][0]++; });
  const qaDone = QA.filter(q => s.qa[q.cat + "::" + q.q]).length;
  sc.interview[1] += 6; sc.interview[0] += 6 * (QA.length ? qaDone / QA.length : 0);
  sc.interview[1] += 1; if (s.pitch.practiced) sc.interview[0] += 1;
  const labDone = Object.keys(s.lab).length;
  sc.interview[1] += 3; sc.interview[0] += 3 * Math.min(1, labDone / LAB.length);
  const chk = QA_CHECKLIST.filter(c => s.qachk[c.id]).length;
  sc.qa[1] += 3; sc.qa[0] += 3 * (chk / QA_CHECKLIST.length);
  const out = TRACKS.map(t => ({ ...t, pct: sc[t.id][1] ? Math.round((sc[t.id][0] / sc[t.id][1]) * 100) : 0 }));
  const overall = Math.round(out.reduce((a, t) => a + t.pct, 0) / out.length);
  return { tracks: out, overall, qaDone, labDone };
}
function refreshProgress() {
  const { tracks, overall, qaDone } = trackScores();
  const fill = document.getElementById("sidebar-progress-fill"), cap = document.getElementById("sidebar-progress-caption");
  if (fill) fill.style.width = overall + "%";
  if (cap) cap.textContent = `${overall}% project complete · ${qaDone}/${QA.length} interview Qs`;
  const hp = document.getElementById("home-progress");
  if (hp) {
    const top = tracks.slice().sort((a, b) => b.pct - a.pct);
    hp.innerHTML = `<h4>Your Progress</h4><div class="big">${overall}%</div><div class="sub">overall project completion</div>
      <div class="track-list">${tracks.slice(0, 5).map(trackRow).join("")}</div>
      <button class="btn-outline" style="margin-top:14px;padding:8px 14px;" data-goto="progress">See full progress →</button>`;
    hp.querySelector("[data-goto]").addEventListener("click", () => switchView("progress"));
  }
  try { renderCertificate(); } catch (e) {}
  const po = document.getElementById("progress-overall");
  if (po) po.innerHTML = `<h4>Overall Progress</h4><div class="big">${overall}%</div><div class="sub">Average of the ten skill tracks below</div>`;
  const tl = document.getElementById("track-list");
  if (tl) tl.innerHTML = tracks.map(trackRow).join("");
  const todo = document.getElementById("progress-todo");
  if (todo) {
    const s = loadState();
    const openJ = JOURNEY.filter(j => !s.journey[j.id]);
    const openD = DELIVERABLES.filter(d => !s.deliv[d.id]);
    const openA = assignments().filter(a => !(s.assign[a.id] && s.assign[a.id].ok));
    const li = (arr, f) => arr.length ? arr.map(f).join("") : `<div style="padding:4px 0;">✓ All done</div>`;
    todo.innerHTML = `<h5 style="margin:0 0 6px;font-size:13px;color:var(--ink);">Journey steps (${openJ.length} open)</h5>${li(openJ.slice(0, 5), j => `<div style="padding:3px 0;">• <a href="#" data-go="${j.go}">${esc(j.t)}</a></div>`)}
      <h5 style="margin:14px 0 6px;font-size:13px;color:var(--ink);">Deliverables (${openD.length} open)</h5>${li(openD.slice(0, 6), d => `<div style="padding:3px 0;">• ${esc(d.t)}</div>`)}
      <h5 style="margin:14px 0 6px;font-size:13px;color:var(--ink);">Assignments (${openA.length} open)</h5>${li(openA.slice(0, 6), a => `<div style="padding:3px 0;">• ${esc(a.t)}</div>`)}`;
    todo.querySelectorAll("[data-go]").forEach(a => a.addEventListener("click", (e) => { e.preventDefault(); switchView(a.dataset.go); }));
  }
}
function trackRow(t) {
  return `<div class="track-row ${t.pct >= 100 ? "complete" : ""}"><div class="tl">${esc(t.name)}</div><div class="tb"><div class="tf" style="width:${t.pct}%"></div></div><div class="tv">${t.pct}%</div></div>`;
}

/* ============================================================
   Home
   ============================================================ */
function renderStats() {
  const wrap = document.getElementById("stat-strip");
  wrap.innerHTML = STATS.map(s => `<div class="stat"><div class="num">${s.num}</div><div class="lbl">${esc(s.lbl)}</div></div>`).join("");
}
function renderJourney() {
  const wrap = document.getElementById("journey"); const s = loadState();
  wrap.innerHTML = JOURNEY.map((j, i) => `
    ${i ? '<div class="journey-arrow">↓</div>' : ""}
    <div class="journey-step ${s.journey[j.id] ? "done" : ""}">
      <div class="jn">${String(i + 1).padStart(2, "0")}</div>
      <div><h4>${esc(j.t)}</h4><p>${esc(j.d)}</p></div>
      <div class="journey-actions">
        <button class="check-pill ${s.journey[j.id] ? "on" : ""}" data-j="${j.id}">${s.journey[j.id] ? "✓ Done" : "Mark done"}</button>
        <button class="start-btn" data-go="${j.go}">Start →</button>
      </div>
    </div>`).join("");
  wrap.querySelectorAll("[data-go]").forEach(b => b.addEventListener("click", () => switchView(b.dataset.go)));
  wrap.querySelectorAll("[data-j]").forEach(b => b.addEventListener("click", () => {
    const st = loadState(); st.journey[b.dataset.j] = !st.journey[b.dataset.j]; saveState(st); renderJourney(); refreshProgress();
  }));
}
function renderChecklist(containerId, items, bucket) {
  const wrap = document.getElementById(containerId); if (!wrap) return;
  const s = loadState();
  wrap.innerHTML = items.map(d => `
    <div class="deliv-item ${s[bucket][d.id] ? "on" : ""}" data-id="${d.id}" role="checkbox" aria-checked="${!!s[bucket][d.id]}" tabindex="0">
      <div class="box">${s[bucket][d.id] ? "✓" : ""}</div>
      <div><h4>${esc(d.t)}</h4><p>${esc(d.d)}</p>${d.where ? `<div class="where">→ ${esc(d.where)}</div>` : ""}</div>
    </div>`).join("");
  wrap.querySelectorAll(".deliv-item").forEach(it => {
    const toggle = () => { const st = loadState(); st[bucket][it.dataset.id] = !st[bucket][it.dataset.id]; saveState(st); renderChecklist(containerId, items, bucket); refreshProgress(); };
    it.addEventListener("click", toggle);
    it.addEventListener("keydown", (e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); toggle(); } });
  });
}
function renderBeforeAfter() {
  const html = `
    <div class="ba-col ba-before"><h4>❌ Before analytics</h4><ul>${BEFORE_AFTER.before.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div class="ba-mid">→</div>
    <div class="ba-col ba-after"><h4>✅ After analytics</h4><div class="ba-flow">${BEFORE_AFTER.after.map((x, i) => `${i ? '<div class="dn">↓</div>' : ""}<div class="node">${esc(x)}</div>`).join("")}</div></div>`;
  ["before-after", "before-after-2"].forEach(id => { const w = document.getElementById(id); if (w) w.innerHTML = html; });
}
function renderTools() {
  const wrap = document.getElementById("tool-grid");
  TOOLS.forEach((t, i) => {
    wrap.appendChild(el("div", "card tool-card", `<img class="tool-logo" src="${t.logo}" alt="${t.name} logo"><h4>${t.name}</h4><div class="role">${t.role}</div><p>${t.desc}</p>`));
    if (i < TOOLS.length - 1) wrap.appendChild(el("div", "tool-arrow", "→"));
  });
}
function renderDomainPrimer() {
  document.getElementById("domain-what").textContent = DOMAIN_WHAT;
  document.getElementById("domain-where").innerHTML = DOMAIN_WHERE.map(x => `<div style="padding:5px 0;">• ${esc(x)}</div>`).join("");
  document.getElementById("domain-data").innerHTML = DOMAIN_DATA_TYPES.map(x => `<span>${esc(x)}</span>`).join("");
}
function renderResourceCards(items, containerId) {
  const wrap = document.getElementById(containerId); if (!wrap) return;
  wrap.innerHTML = "";
  items.forEach(d => {
    const action = d.type === "download"
      ? `<a class="doc-download" href="${d.href}" download="${d.filename}" title="Download ${d.name}">⬇</a>`
      : `<a class="doc-download" href="${d.href}" target="_blank" rel="noopener" title="Open ${d.name}">↗</a>`;
    wrap.appendChild(el("div", "card doc-card", `<div class="doc-icon">${d.icon}</div><div class="doc-info"><h4>${esc(d.name)}</h4><p>${esc(d.desc)}</p></div>${action}`));
  });
}
function renderDocuments() {
  renderResourceCards(SOFTWARE_LINKS, "software-grid");
  renderResourceCards(DOCUMENTS, "doc-grid");
  renderResourceCards(DOCUMENTS, "doc-grid-2");
  const ss = document.getElementById("setup-steps");
  if (ss) ss.innerHTML = SETUP_STEPS.map((s, i) => `<div class="card setup-step"><div class="si">${s.i}</div><div class="sn">STEP ${i + 1}</div><h4>${esc(s.t)}</h4><p>${esc(s.d)}</p></div>`).join("");
}
function renderFlow() {
  document.getElementById("flow-grid").innerHTML = FLOW.map((f, i) => `<div class="flow-step"><div class="idx">${String(i + 1).padStart(2, "0")}</div><h4>${esc(f.t)}</h4><p>${esc(f.d)}</p></div>`).join("");
}
function renderTimeline() {
  document.getElementById("timeline").innerHTML = TIMELINE.map(r => `<div class="timeline-row"><div class="d">${r.d}</div><div class="t">${r.t}</div><div>${esc(r.task)}</div></div>`).join("");
}

/* ============================================================
   Business problem
   ============================================================ */
function renderProblem() {
  const pg = document.getElementById("problem-grid");
  pg.innerHTML = PROBLEM_STATEMENT.map(r => `<div class="card rule-card"><div class="head"><div class="icon-badge">${r.icon}</div><h4>${esc(r.h)}</h4></div><p>${esc(r.p)}</p></div>`).join("");
  const list = document.getElementById("bq-list");
  list.innerHTML = bq().map((b, i) => `
    <div class="bq-item ${i === 0 ? "open" : ""}">
      <div class="bq-head"><span class="bqn">Q${i + 1}</span><h4>${esc(b.q)}</h4><span class="chev">⌄</span></div>
      <div class="bq-body"><div class="chain">
        <div class="chain-step"><div class="cl">Question</div><p>${esc(b.q)}</p></div>
        <div class="chain-step"><div class="cl">Data</div><p>${esc(b.data)}</p></div>
        <div class="chain-step"><div class="cl">KPI</div><p>${esc(b.kpi)}</p></div>
        <div class="chain-step"><div class="cl">Analysis</div><p>${esc(b.analysis)}</p></div>
        <div class="chain-step"><div class="cl">Insight</div><p>${esc(b.insight)}</p></div>
        <div class="chain-step rec"><div class="cl">Recommendation</div><p>${esc(b.rec)}</p></div>
      </div></div>
    </div>`).join("");
  list.querySelectorAll(".bq-head").forEach(h => h.addEventListener("click", () => h.parentElement.classList.toggle("open")));
  document.getElementById("req-table").innerHTML = `<thead><tr><th>Req</th><th>Page / Area</th><th>Stakeholder</th><th>What it must answer</th><th>Priority</th></tr></thead>
    <tbody>${REQUIREMENTS.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
function renderRules() {
  document.getElementById("rule-grid").innerHTML = RULES.map(r => `<div class="card rule-card ${r.ok ? "ok" : ""}"><div class="head"><div class="icon-badge">${r.icon}</div><h4>${esc(r.h)}</h4></div><p>${esc(r.p)}</p></div>`).join("");
  document.getElementById("focus-grid").innerHTML = FOCUS_AREAS.map(f => `<div class="card tip-card"><h4 style="margin-top:0;">${esc(f.h)}</h4><p>${esc(f.p)}</p></div>`).join("");
}

/* ============================================================
   Data pages
   ============================================================ */
function renderDataset() {
  document.getElementById("coverage-text").textContent = COVERAGE_TEXT;
  const rows = {}; Object.keys(TABLE_SRC).forEach(t => rows[t] = (CRM.rows || {})[TABLE_SRC[t]]);
  document.getElementById("ds-grid").innerHTML = Object.keys(TABLE_TYPES).map(t => {
    const ty = TABLE_TYPES[t]; const cls = ty === "Dimension" ? "dim" : "fact";
    const pu = TABLE_PURPOSE[t] || ["", ""];
    return `<div class="card ds-card ${cls}"><div class="k">${esc(ty)}</div><h4>${t}</h4><div class="rows">${Number(rows[t] || 0).toLocaleString("en-IN")} rows${TABLE_SRC[t] ? " · source: " + esc(TABLE_SRC[t]) : ""}</div>
      <dl class="ds-meta"><dt>Grain</dt><dd>${esc(TABLE_GRAIN[t])}</dd><dt>PK</dt><dd><code>${TABLE_PK[t]}</code></dd><dt>FK</dt><dd>${esc(TABLE_FK[t] || "—")}</dd><dt>Date</dt><dd>${esc(TABLE_DATE[t] || "—")}</dd><dt>Purpose</dt><dd>${esc(pu[0])}</dd></dl>
      <details class="ds-why"><summary>Why does this table exist?</summary><p>${esc(pu[1])}</p></details></div>`;
  }).join("");
  document.getElementById("story-table").innerHTML = `<thead><tr><th>When</th><th>Event</th><th>What happened</th><th>Where you'll see it</th></tr></thead>
    <tbody>${STORY.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}
function renderModel() {
  const rows = {}; Object.keys(TABLE_SRC).forEach(t => rows[t] = (CRM.rows || {})[TABLE_SRC[t]]);
  document.getElementById("schema-grid").innerHTML = Object.keys(TABLE_TYPES).map(t => {
    const ty = TABLE_TYPES[t]; const isFact = ty.startsWith("Fact");
    return `<div class="table-node ${isFact ? "fact" : ""} ${t === "fact_opportunity" ? "center" : ""}"><div class="hd"><span>${t}</span><span>${Number(rows[t] || 0).toLocaleString("en-IN")}</span></div>
      <div class="bd"><div><span class="pk">${TABLE_PK[t]}</span> · PK</div><div>FK: ${TABLE_FK[t] || "—"}</div><div style="margin-top:4px;opacity:.85;">${ty}</div></div></div>`;
  }).join("");
  const rel = document.getElementById("rel-list");
  rel.innerHTML = `<h4 style="font-size:15px;margin-bottom:6px;">Relationships</h4>` + RELATIONSHIPS.map(r => `<div class="r"><span class="card-arrow">↳</span><span>${esc(r)}</span></div>`).join("");
  document.getElementById("load-order").innerHTML = LOAD_ORDER.map(x => `<div style="padding:5px 0;">${esc(x)}</div>`).join("");
  document.getElementById("calc-fields").innerHTML = CALC_FIELDS.map(x => `<div style="padding:5px 0;">• ${esc(x)}</div>`).join("");
  document.getElementById("gotchas-list").innerHTML = GOTCHAS.map(g => `<div class="gotcha-card"><div class="gotcha-title">⚠️ ${esc(g.t)}</div><div class="gotcha-desc">${esc(g.d)}</div></div>`).join("");
  document.getElementById("global-filters").innerHTML = GLOBAL_FILTERS.map(([n, src]) =>
    `<div style="display:flex;justify-content:space-between;gap:16px;padding:7px 0;border-top:1px solid var(--line-soft);"><span style="font-weight:600;color:var(--ink);">${esc(n)}</span><span style="font-family:var(--mono);font-size:12px;">${esc(src)}</span></div>`).join("");
  document.getElementById("join-guide-table").innerHTML = `<thead><tr><th>Type</th><th>Table</th><th>Primary Key</th><th>Foreign Keys</th><th>Grain</th><th>Rows</th></tr></thead>
    <tbody>${Object.keys(TABLE_TYPES).map(t => `<tr><td>${esc(TABLE_TYPES[t])}</td><td><code>${t}</code></td><td>${TABLE_PK[t]}</td><td>${TABLE_FK[t] || "—"}</td><td>${esc(TABLE_GRAIN[t])}</td><td class="num">${Number(rows[t] || 0).toLocaleString("en-IN")}</td></tr>`).join("")}</tbody>`;
  document.getElementById("dash-table").innerHTML = `<thead><tr><th>#</th><th>Page</th><th>Audience</th><th>Primary KPIs</th><th>Key visuals</th></tr></thead>
    <tbody>${DASHBOARDS.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
  const jp = document.getElementById("join-paths-table");
  if (jp) jp.innerHTML = `<thead><tr><th>Analysis</th><th>Join condition</th></tr></thead><tbody>${M_JOIN_PATHS.map(([a, b]) => `<tr><td>${esc(a)}</td><td><code>${esc(b)}</code></td></tr>`).join("")}</tbody>`;
  const img = document.getElementById("model-img");
  if (img) img.addEventListener("click", () => openModal(`<img class="zoom-img" src="${img.src}" alt="${esc(img.alt)}">`));
}
let ddKind = "All";
function renderDataDictionary(filterText) {
  const wrap = document.getElementById("datadict-tables"); if (!wrap) return;
  const q = (filterText !== undefined ? filterText : (document.getElementById("dd-search") || {}).value || "").trim().toLowerCase();
  const pills = document.getElementById("dd-pills");
  if (pills && !pills.children.length) {
    ["All", "Fact", "Dimension"].forEach(k => {
      const b = el("button", "pill" + (k === ddKind ? " active" : ""), k);
      b.dataset.k = k;
      b.addEventListener("click", () => { ddKind = k; pills.querySelectorAll(".pill").forEach(p => p.classList.toggle("active", p.dataset.k === k)); renderDataDictionary(); });
      pills.appendChild(b);
    });
  }
  wrap.innerHTML = "";
  M_DATA_DICTIONARY.forEach(t => {
    const kind = /^(Account|User)/.test(t.table) ? "Dimension" : "Fact";
    if (ddKind !== "All" && kind !== ddKind) return;
    const rows = t.cols.filter(c => !q || (t.table + " " + c.join(" ")).toLowerCase().includes(q));
    if (!rows.length) return;
    const card = el("div", "card dd-table-card table-scroll");
    card.innerHTML = `<div class="hd"><h4>${t.table}</h4><span class="tag p2">${esc(t.rows)}</span></div>
      <table class="dtable"><thead><tr><th>Column</th><th>Type</th><th>Description</th><th>Example / blanks</th></tr></thead>
      <tbody>${rows.map(([c, ty, d, n]) => `<tr><td><code>${esc(c)}</code></td><td><span class="col-type">${ty}</span></td><td>${esc(d)}</td><td>${esc(n)}</td></tr>`).join("")}</tbody></table>`;
    wrap.appendChild(card);
  });
  if (!wrap.children.length) wrap.appendChild(el("div", "empty-state", "No columns match that search."));
}
function renderQuality() {
  document.getElementById("null-notes").innerHTML = NULL_NOTES.map(x => `<div style="padding:6px 0;border-top:1px solid var(--line-soft);">• ${esc(x)}</div>`).join("");
  document.getElementById("dq-table").innerHTML = `<thead><tr><th>Check</th><th>Rule</th><th>Tables</th><th>Severity</th></tr></thead>
    <tbody>${DQ_RULES.map(r => `<tr>${r.map(c => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
}

/* ============================================================
   KPI Library
   ============================================================ */
let kpiActiveCat = "All", kpiSearch = "", kpiStarredOnly = false, kpiTier = "All";
function renderKpiTiers() {
  ["P1", "P2", "P3"].forEach(p => { const e = document.getElementById("kr-" + p.toLowerCase()); if (e) e.textContent = KPIS.filter(k => k.prio === p).length + " KPIs"; });
  const w = document.getElementById("kpi-tier-pills"); if (!w) return; w.innerHTML = "";
  [["All", "All tiers"], ["P1", "P1 · Must know"], ["P2", "P2 · Important"], ["P3", "P3 · Advanced"]].forEach(([v, l]) => {
    const b = el("button", "pill" + (v === kpiTier ? " active" : ""), l); b.addEventListener("click", () => { kpiTier = v; renderKpiTiers(); renderKpiGrid(); }); w.appendChild(b);
  });
}
function renderKpiPills() {
  const wrap = document.getElementById("kpi-pills"); wrap.innerHTML = "";
  KPI_CATS.forEach(c => {
    const n = c === "All" ? KPIS.length : KPIS.filter(k => k.cat === c).length;
    const b = el("button", "pill" + (c === kpiActiveCat ? " active" : ""), `${c} (${n})`);
    b.addEventListener("click", () => { kpiActiveCat = c; renderKpiPills(); renderKpiGrid(); });
    wrap.appendChild(b);
  });
}
function renderKpiGrid() {
  const wrap = document.getElementById("kpi-grid"); wrap.innerHTML = "";
  const q = kpiSearch.trim().toLowerCase(); const bm = getBookmarks();
  const list = KPIS.filter(k => (kpiTier === "All" || k.prio === kpiTier) && (kpiActiveCat === "All" || k.cat === kpiActiveCat) && (!q || (k.name + k.q + k.desc + k.formula + k.table + k.dax).toLowerCase().includes(q)) && (!kpiStarredOnly || bm.kpi[k.name]));
  if (!list.length) { wrap.appendChild(el("div", "empty-state", kpiStarredOnly ? "No starred KPIs yet. Tap the ★ on any card to save it here." : "No KPIs match that search.")); return; }
  list.forEach(k => {
    const starred = !!bm.kpi[k.name];
    const c = el("div", "card kpi-card"); c.id = "kpi-" + slugify(k.name);
    c.innerHTML = `
      <div class="top"><h4>${esc(k.name)}</h4>
        <div class="card-top-actions"><span class="tag ${k.prio === "P1" ? "p1" : "p2"} tier-${k.prio}">${k.prio}</span>
          <button class="link-btn" title="Copy link to this KPI" data-link-kpi="${esc(k.name)}">🔗</button>
          <button class="star-btn ${starred ? "starred" : ""}" title="Star this KPI" data-star-kpi="${esc(k.name)}">${starred ? "★" : "☆"}</button></div></div>
      <p class="kpi-q">${esc(k.q)}</p>
      <p class="kpi-logic">${esc(k.desc)}</p>
      <div class="kpi-plain">${esc(k.plain)}</div>
      <div class="formula">${esc(k.formula)}</div>
      ${k.dax ? `<div class="formula dax">${esc(k.dax)}</div>` : ""}
      <div class="kpi-ans"><span>Answer key (2015): ${esc(k.v25)}</span>${k.wrong ? `<span class="bm">⚠ Wrong: ${esc(k.wrong)}</span>` : ""}</div>
      <div class="meta"><span>${esc(k.table)}</span><span>${esc(k.cat)} · ${esc(k.dir)}</span></div>`;
    wrap.appendChild(c);
  });
  wrap.querySelectorAll("[data-star-kpi]").forEach(b => b.addEventListener("click", () => { toggleBookmark("kpi", b.dataset.starKpi); renderKpiGrid(); }));
  wrap.querySelectorAll("[data-link-kpi]").forEach(b => b.addEventListener("click", () => copyDeepLink("kpi", b.dataset.linkKpi)));
}

/* ============================================================
   SQL, Excel, Analysis
   ============================================================ */
let sqlCat = "All", sqlPractice = false;
function sqlHint(sql) {
  const kw = (sql.match(/\b(SELECT|JOIN|LEFT JOIN|WHERE|GROUP BY|HAVING|ORDER BY|WITH|CASE|SUM|COUNT|AVG|DATEDIFF|ROW_NUMBER|RANK|COALESCE|COUNT_IF|IFF|TRY_TO_NUMBER|TO_DATE|COPY INTO|CREATE TABLE|CREATE OR REPLACE VIEW|UNION ALL)\b/gi) || []).map(x => x.toUpperCase());
  const tables = sql.match(/\b((?:RAW|STG|MART)\.\w+|fact_\w+|dim_\w+|vw_\w+)\b/g) || [];
  return `Tables: ${[...new Set(tables)].join(", ") || "—"} · Key SQL: ${[...new Set(kw)].slice(0, 8).join(", ")}`;
}
function sqlBlockHtml(b, idx, prefix) {
  const exp = (b.sql.match(/--\s*[^\n]*\d[^\n]*/g) || []).slice(0, 3).map(x => x.replace(/^--\s*/, "")).join(" · ");
  if (prefix === "s" && sqlPractice) {
    return `<div class="card sql-block practice"><div class="hd"><div><h4>${esc(b.title)}</h4><p><strong>Your task:</strong> ${esc(b.desc)}</p></div></div>
      ${exp ? `<div class="sql-expect">🎯 Expected result: ${esc(exp)}</div>` : ""}
      <div class="sql-steps"><button class="btn-outline" data-hint="${idx}">💡 Show hint</button><button class="btn-blue" data-reveal="${idx}">🔓 Reveal solution</button></div>
      <div class="hint-text" id="sqlh-${idx}" style="display:none;">${esc(sqlHint(b.sql))}</div>
      <pre id="sqls-${idx}" style="display:none;">${esc(b.sql)}</pre></div>`;
  }
  return `<div class="card sql-block"><div class="hd"><div><h4>${esc(b.title)}</h4><p>${esc(b.desc)}</p></div><button class="copy-btn" data-copy="${prefix}${idx}">Copy</button></div><pre>${esc(b.sql)}</pre></div>`;
}
function renderSql() {
  const pills = document.getElementById("sql-pills");
  const cats = ["All", ...new Set(SQL_BLOCKS.map(b => b.cat))];
  pills.innerHTML = "";
  cats.forEach(c => { const b = el("button", "pill" + (c === sqlCat ? " active" : ""), c); b.addEventListener("click", () => { sqlCat = c; renderSql(); }); pills.appendChild(b); });
  const wrap = document.getElementById("sql-list");
  wrap.innerHTML = SQL_BLOCKS.map((b, i) => (sqlCat === "All" || b.cat === sqlCat) ? sqlBlockHtml(b, i, "s") : "").join("");
  wrap.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", () => copyText(SQL_BLOCKS[+btn.dataset.copy.slice(1)].sql, btn, "Copy")));
  wrap.querySelectorAll("[data-hint]").forEach(b => b.addEventListener("click", () => { const x = document.getElementById("sqlh-" + b.dataset.hint); x.style.display = x.style.display === "none" ? "block" : "none"; }));
  wrap.querySelectorAll("[data-reveal]").forEach(b => b.addEventListener("click", () => { document.getElementById("sqls-" + b.dataset.reveal).style.display = "block"; b.remove(); }));
  const t = document.getElementById("sql-practice-toggle");
  if (t && !t._bound) { t._bound = true; t.addEventListener("click", () => { sqlPractice = !sqlPractice; t.textContent = sqlPractice ? "Turn practice mode OFF" : "Turn practice mode ON"; renderSql(); }); }
}
function renderExcel() {
  document.getElementById("excel-table").innerHTML = `<thead><tr><th>Calculation</th><th>Excel formula pattern</th><th>Expected result</th><th>Status</th></tr></thead>
    <tbody>${EXCEL_TASKS.map(r => `<tr><td>${esc(r[0])}</td><td><code>${esc(r[1])}</code></td><td>${esc(r[2])}</td><td>${esc(r[3])}</td></tr>`).join("")}</tbody>`;
  document.getElementById("pivot-grid").innerHTML = PIVOTS.map(t => `<div class="card tip-card"><div class="n">${t.n}</div><h4>${esc(t.h)}</h4><p>${esc(t.p)}</p></div>`).join("");
}
function renderAnalysis() {
  const base = A.winrate || 42.77;
  document.getElementById("vol-base").textContent = f2(base) + "%";
  const card = (t, sub, data, opts, suffix) => `<div class="card chart-card"><h4>${esc(t)}</h4><div class="cs">${esc(sub)}</div>${renderBarBlock({ title: "", data: data || [], suffix: suffix || "" }, opts)}</div>`;
  document.getElementById("driver-grid").innerHTML =
      card("Win rate % by industry", "Closed deals, industries with 80+ closed · green = >15% above the overall rate, red = >15% below", MD.winrate_industry, { base, goodHigh: true }, "%")
    + card("Win rate % by opportunity source", "Lead Source on the opportunity, 80+ closed deals", MD.winrate_source, { base, goodHigh: true }, "%")
    + card("Rep win rate % (50+ closed deals)", "Best closers aren't always the biggest earners", MD.rep_winrate, { base, goodHigh: true }, "%")
    + card("Lead conversion % by source", `Overall ${f2(A.convrate)}% · sources with 100+ leads`, MD.conv_by_source, undefined, "%")
    + card("Won revenue by deal size ($M)", `${A.enterprise_n} Enterprise deals = ${f1(A.enterprise_share)}% of won revenue`, MD.deal_bands_rev_m)
    + card("Won deals by deal size (count)", "Most deals are small; revenue is in the few big ones", MD.deal_bands)
    + card("Won revenue by close year ($M)", "2021: −8.8% vs 2020, with fewer but bigger deals", MD.won_rev_year_m)
    + card("Top loss reasons", `${f1(A.top2_loss_share)}% of losses are 'Non Responsive' or 'Duplicate'`, MD.loss_reason);
  document.getElementById("insights-grid").innerHTML = bq().slice(0, 6).map((k, i) => `
    <div class="card insight-card tint-${i % 6}"><div class="insight-label">Insight</div><p class="insight-text">${esc(k.insight)}</p>
    <div class="insight-label rec">Recommendation</div><p class="insight-text">${esc(k.rec)}</p></div>`).join("");
}

/* ============================================================
   Dashboard gallery + modal
   ============================================================ */
function openModal(html) {
  document.getElementById("modal-body").innerHTML = html;
  document.getElementById("modal-overlay").classList.add("open");
}
function closeModal() { document.getElementById("modal-overlay").classList.remove("open"); }
function initModal() {
  const ov = document.getElementById("modal-overlay");
  document.getElementById("modal-close").addEventListener("click", closeModal);
  ov.addEventListener("click", (e) => { if (e.target === ov) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });
}
function renderGallery() {
  const pages = galleryPages();
  document.getElementById("gallery-grid").innerHTML = pages.map((p, i) => `
    <div class="card gallery-card">
      <div class="gtop"><div class="gnum">${p.n}</div><h4>${esc(p.t)}</h4><div class="gk">${p.keys.map(k => `<span>${esc(k)}</span>`).join("")}</div></div>
      <div class="gbody"><div class="gq">❓ ${esc(p.q)}</div><p>${esc(p.desc)}</p><div class="gins">💡 ${esc(p.ins)}</div><div class="gaud">Audience: ${esc(p.aud)}</div><button class="btn-blue" data-dash="${i}">View Dashboard →</button></div>
    </div>`).join("");
  document.querySelectorAll("[data-dash]").forEach(b => b.addEventListener("click", () => {
    const p = pages[+b.dataset.dash];
    openModal(`<div class="flow-strip"><div><span>Business question</span>${esc(p.q)}</div><div><span>KPIs</span>${esc(p.keys.join(" · "))}</div><div><span>Key insight</span>${esc(p.ins)}</div><div><span>Interview question</span>${esc(p.iq)}</div></div>` + renderDashMock(p.mock) + `<div class="build-notes">
      <div class="card"><h5>📈 Build it in Tableau</h5><ul>${p.build.tableau.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="card"><h5>⚡ Build it in Power BI</h5><ul>${p.build.powerbi.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div></div>`);
  }));
}

/* ============================================================
   QA page
   ============================================================ */
const RECON_KPIS = ["Total Leads", "Converted Leads", "Lead Conversion Rate", "Converted Accounts", "Converted Opportunities", "Total Opportunities", "Active (Open) Opportunities",
  "Total Won Revenue", "Win Rate", "Loss Rate", "Opportunity Conversion Rate", "Expected Pipeline Value", "Avg Deal Size (Won)"];
function renderQA() {
  const wrap = document.getElementById("qa-sql-list");
  wrap.innerHTML = QA_SQL.map((b, i) => sqlBlockHtml(b, i, "q")).join("");
  wrap.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", () => copyText(QA_SQL[+btn.dataset.copy.slice(1)].sql, btn, "Copy")));
  const s = loadState();
  const rows = RECON_KPIS.map(n => KPIS.find(k => k.name === n)).filter(Boolean);
  const t = document.getElementById("recon-table");
  t.innerHTML = `<thead><tr><th>KPI (answer key)</th><th>SQL / answer key</th><th>Your Tableau value</th><th>Your Power BI value</th><th>Status</th></tr></thead>
    <tbody>${rows.map(k => {
      const r = s.recon[k.id] || {};
      return `<tr data-id="${k.id}" data-ans="${esc(k.v25)}"><td>${esc(k.name)}</td><td class="num">${esc(k.v25)}</td>
        <td><input class="search-input" style="max-width:130px;padding:6px 10px;" data-f="tab" value="${esc(r.tab || "")}"></td>
        <td><input class="search-input" style="max-width:130px;padding:6px 10px;" data-f="pbi" value="${esc(r.pbi || "")}"></td>
        <td class="st"></td></tr>`;
    }).join("")}</tbody>`;
  const evalRow = (tr) => {
    const ans = parseFloat(String(tr.dataset.ans).replace(/[^0-9.\-]/g, ""));
    const vals = [...tr.querySelectorAll("input")].map(i => i.value.trim());
    const ok = vals.map(v => v !== "" && Math.abs(parseFloat(v.replace(/[^0-9.\-]/g, "")) - ans) <= Math.max(0.011, Math.abs(ans) * 0.001));
    const st = tr.querySelector(".st");
    if (vals.every(v => v === "")) st.textContent = "";
    else if (ok.every(Boolean)) st.innerHTML = `<span class="recon-ok">✓ Ties out</span>`;
    else st.innerHTML = `<span style="color:var(--red);font-weight:700;">✗ Investigate</span>`;
  };
  t.querySelectorAll("tbody tr").forEach(tr => {
    evalRow(tr);
    tr.querySelectorAll("input").forEach(inp => inp.addEventListener("input", () => {
      const st = loadState(); st.recon[tr.dataset.id] = st.recon[tr.dataset.id] || {}; st.recon[tr.dataset.id][inp.dataset.f] = inp.value; saveState(st); evalRow(tr);
    }));
  });
  renderChecklist("qa-checklist", QA_CHECKLIST, "qachk");
}

/* ============================================================
   Assignments
   ============================================================ */
function renderAssignments() {
  const list = assignments(); const s = loadState();
  const done = list.filter(a => s.assign[a.id] && s.assign[a.id].ok).length;
  document.getElementById("assign-score").textContent = `${done} / ${list.length} assignments solved`;
  const wrap = document.getElementById("assign-list");
  wrap.innerHTML = list.map((a, i) => {
    const st = s.assign[a.id] || {};
    const input = a.type === "select"
      ? `<select data-in="${a.id}"><option value="">Choose…</option>${a.options.map(o => `<option ${st.last === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`
      : `<input type="text" inputmode="decimal" data-in="${a.id}" placeholder="Your answer${a.unit ? " (" + a.unit + ")" : ""}" value="${esc(st.last || "")}">`;
    return `<div class="card assign-card" id="as-${a.id}">
      <div class="assign-head"><span class="an">Assignment ${String(i + 1).padStart(2, "0")}</span><div><h4>${esc(a.t)}</h4><div class="tool">${esc(a.tool)}</div></div>
        <span class="status ${st.ok ? "ok" : ""}">${st.ok ? "✓ Solved" : st.tries ? `${st.tries} attempt${st.tries > 1 ? "s" : ""}` : "Not started"}</span></div>
      <div class="assign-steps"><button data-tab="task" class="active">1 · View Task</button><button data-tab="check">2 · Check Answer</button><button data-tab="sol">3 · Solution</button></div>
      <div class="assign-panel show" data-p="task"><strong>What to do</strong><ul>${a.task.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>
      <div class="assign-panel" data-p="check"><div class="answer-row">${input}<button class="btn-blue" data-check="${a.id}">Check</button><button class="btn-outline" data-hint="${a.id}">Hint</button></div>
        <div class="answer-feedback ${st.ok ? "good" : ""}">${st.ok ? "✓ Correct, and it matches the dataset." : ""}</div><div class="hint-text" style="display:none;">💡 ${esc(a.hint)}</div></div>
      <div class="assign-panel" data-p="sol">${st.tries ? `<pre>${esc(a.sol)}</pre>` : `<div class="hint-text">🔒 Make at least one attempt in <strong>Check Answer</strong> to unlock the solution.</div>`}</div>
    </div>`;
  }).join("");
  wrap.querySelectorAll(".assign-card").forEach(card => {
    card.querySelectorAll("[data-tab]").forEach(b => b.addEventListener("click", () => {
      card.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x === b));
      card.querySelectorAll("[data-p]").forEach(p => p.classList.toggle("show", p.dataset.p === b.dataset.tab));
    }));
  });
  wrap.querySelectorAll("[data-hint]").forEach(b => b.addEventListener("click", () => { const h = b.closest(".assign-panel").querySelector(".hint-text"); h.style.display = h.style.display === "none" ? "block" : "none"; }));
  wrap.querySelectorAll("[data-check]").forEach(b => b.addEventListener("click", () => {
    const a = list.find(x => x.id === b.dataset.check);
    const inp = wrap.querySelector(`[data-in="${a.id}"]`); const raw = inp.value.trim();
    if (!raw) return;
    let ok;
    if (a.type === "select") ok = raw === a.ans;
    else { const v = parseFloat(raw.replace(/[₹,%\s]/g, "")); ok = !isNaN(v) && Math.abs(v - a.ans) <= (a.tol || 0) + 1e-9; }
    const st = loadState(); const cur = st.assign[a.id] || { tries: 0 };
    cur.tries = (cur.tries || 0) + 1; cur.last = raw; if (ok) cur.ok = true; st.assign[a.id] = cur; saveState(st);
    renderAssignments(); refreshProgress();
    const card = document.getElementById("as-" + a.id);
    card.querySelectorAll("[data-tab]").forEach(x => x.classList.toggle("active", x.dataset.tab === "check"));
    card.querySelectorAll("[data-p]").forEach(p => p.classList.toggle("show", p.dataset.p === "check"));
    const fb = card.querySelector(".answer-feedback");
    fb.className = "answer-feedback " + (ok ? "good" : "bad");
    fb.textContent = ok ? "✓ Correct, and it matches the dataset." : "✗ Not quite. Re-check your filters (dates, status, denominator), use the hint, or open the solution.";
  }));
}

/* ============================================================
   Analyst Thinking Lab
   ============================================================ */
function renderLab() {
  const s = loadState();
  const answered = Object.keys(s.lab).length;
  const best = Object.entries(s.lab).filter(([i, c]) => LAB[+i] && LAB[+i].opts[c] && LAB[+i].opts[c][1] === "best").length;
  document.getElementById("lab-score").textContent = `${answered} / ${LAB.length} scenarios answered · ${best} best-first-move picks`;
  const wrap = document.getElementById("lab-list");
  wrap.innerHTML = LAB.map((l, i) => {
    const pick = s.lab[i];
    return `<div class="card lab-card"><div class="lab-n">Scenario ${String(i + 1).padStart(2, "0")}</div><h4>${esc(l.t)}</h4><p class="scn">${esc(l.scn)}</p>
      <div class="lab-opts">${l.opts.map((o, j) => `<button class="lab-opt ${pick !== undefined ? o[1] : ""}" data-l="${i}" data-o="${j}">${"ABCD"[j]}. ${esc(o[0])}${pick !== undefined ? (o[1] === "best" ? " ✓ best first move" : o[1] === "ok" ? " · reasonable, not first" : "") : ""}${pick === j ? " ← your pick" : ""}</button>`).join("")}</div>
      <div class="lab-explain ${pick !== undefined ? "show" : ""}"><strong>What an analyst checks first:</strong><ol>${l.exp.map(x => `<li>${esc(x)}</li>`).join("")}</ol></div></div>`;
  }).join("");
  wrap.querySelectorAll("[data-l]").forEach(b => b.addEventListener("click", () => {
    const st = loadState(); st.lab[b.dataset.l] = +b.dataset.o; saveState(st); renderLab(); refreshProgress();
  }));
}

/* ============================================================
   Interview Q&A
   ============================================================ */
let qaActiveCat = "Explain This Project", qaSearch = "", qaStarredOnly = false;
function renderQaTabs() {
  const wrap = document.getElementById("qa-tabs"); wrap.innerHTML = "";
  QA_CATS.forEach(c => {
    const b = el("button", c === qaActiveCat ? "active" : "", `${c} (${QA.filter(q => q.cat === c).length})`);
    b.addEventListener("click", () => { qaActiveCat = c; renderQaTabs(); renderQaList(); });
    wrap.appendChild(b);
  });
}
function renderQaList() {
  const wrap = document.getElementById("qa-list"); wrap.innerHTML = "";
  const st = loadState(); const bm = getBookmarks(); const q = qaSearch.trim().toLowerCase();
  const list = QA.filter(it => (q ? true : it.cat === qaActiveCat) && (!q || (it.q + it.a).toLowerCase().includes(q)) && (!qaStarredOnly || bm.qa[it.q]));
  updateQaProgressBar();
  if (!list.length) { wrap.appendChild(el("div", "empty-state", qaStarredOnly ? "No starred questions yet. Tap the ★ on any question to save it here." : "No questions match that search.")); return; }
  list.forEach(item => {
    const id = item.cat + "::" + item.q; const done = !!st.qa[id]; const starred = !!bm.qa[item.q]; const isLong = item.a.length > 480;
    const card = el("div", "qa-item" + (done ? " reviewed" : "")); card.id = "qa-" + slugify(item.q);
    card.innerHTML = `
      <div class="qa-q"><span class="num">${esc(item.cat)}</span><span class="qtext">${esc(item.q)}</span>
        <button class="link-btn" title="Copy link to this question">🔗</button>
        <button class="star-btn ${starred ? "starred" : ""}" title="Star this question">${starred ? "★" : "☆"}</button><span class="chev">⌄</span></div>
      <div class="qa-a"><div class="qa-a-inner">
        <div class="answer-text ${isLong ? "clamped" : ""}"><p>${item.a}</p></div>
        ${isLong ? '<button type="button" class="show-full-btn">Show full answer ▾</button>' : ""}
        <div class="signal">Interviewer signal: ${esc(item.signal)}</div>
        ${item.src ? `<div class="q-src">📚 Source: <a href="${item.src[1]}" target="_blank" rel="noopener">${esc(item.src[0])} ↗</a></div>` : ""}
        <button class="mark-btn ${done ? "done" : ""}">${done ? "✓ Reviewed" : "Mark as reviewed"}</button></div></div>`;
    const aDiv = card.querySelector(".qa-a");
    card.querySelector(".qa-q").addEventListener("click", (ev) => {
      if (ev.target.closest(".star-btn") || ev.target.closest(".link-btn")) return;
      const open = card.classList.toggle("open"); aDiv.style.maxHeight = open ? aDiv.scrollHeight + "px" : "0px";
    });
    const sf = card.querySelector(".show-full-btn");
    if (sf) sf.addEventListener("click", (ev) => { ev.stopPropagation(); const t = card.querySelector(".answer-text"); const c = t.classList.toggle("clamped"); sf.textContent = c ? "Show full answer ▾" : "Show less ▴"; if (card.classList.contains("open")) aDiv.style.maxHeight = aDiv.scrollHeight + "px"; });
    const mb = card.querySelector(".mark-btn");
    mb.addEventListener("click", (ev) => { ev.stopPropagation(); const s2 = loadState(); s2.qa[id] = !s2.qa[id]; saveState(s2); mb.classList.toggle("done", s2.qa[id]); mb.textContent = s2.qa[id] ? "✓ Reviewed" : "Mark as reviewed"; card.classList.toggle("reviewed", !!s2.qa[id]); updateQaProgressBar(); refreshProgress(); });
    card.querySelector(".star-btn").addEventListener("click", (ev) => { ev.stopPropagation(); toggleBookmark("qa", item.q); renderQaList(); });
    card.querySelector(".link-btn").addEventListener("click", (ev) => { ev.stopPropagation(); copyDeepLink("qa", item.q); });
    wrap.appendChild(card);
  });
}
function updateQaProgressBar() {
  const st = loadState(); const done = QA.filter(it => st.qa[it.cat + "::" + it.q]).length; const pct = QA.length ? Math.round(done / QA.length * 100) : 0;
  const t = document.getElementById("progress-text"), b = document.getElementById("progress-bar");
  if (t) t.textContent = `${done} / ${QA.length} reviewed`; if (b) b.style.width = pct + "%";
}

/* ============================================================
   Pitch, career, glossary, tips, learn
   ============================================================ */
let pitchTimer = null, pitchLeft = 90;
function renderPitch() {
  document.getElementById("pitch-flow").innerHTML = PITCH_FLOW.map((p, i) => `<div class="pitch-step"><div class="ps-n">${String(i + 1).padStart(2, "0")} ${i < PITCH_FLOW.length - 1 ? "→" : ""}</div><h4>${esc(p.t)}</h4><p>${esc(p.d)}</p><div class="sec">${p.s}</div></div>`).join("");
  document.getElementById("elevator-pitch").textContent = ELEVATOR_PITCH;
  document.getElementById("copy-pitch-btn").addEventListener("click", (e) => copyText(ELEVATOR_PITCH, e.currentTarget, "📋 Copy pitch"));
  document.getElementById("project-faq").innerHTML = PROJECT_FAQ.map(f => `<div class="faq-item"><h4>${esc(f.q)}</h4><p>${esc(f.a)}</p></div>`).join("");
  const ta = document.getElementById("pitch-text"), timer = document.getElementById("pitch-timer");
  const st = loadState(); if (st.pitch.text) ta.value = st.pitch.text;
  const draw = () => { const m = Math.floor(Math.abs(pitchLeft) / 60), s = Math.abs(pitchLeft) % 60; timer.textContent = (pitchLeft < 0 ? "+" : "") + m + ":" + String(s).padStart(2, "0"); timer.className = "timer" + (pitchLeft < 0 ? " over" : pitchLeft <= 15 ? " warn" : ""); };
  const analyse = () => {
    const txt = ta.value.toLowerCase(); const words = (ta.value.trim().match(/\S+/g) || []).length;
    document.getElementById("pitch-meta").textContent = `${words} words · about ${Math.round(words / 2.5)} seconds spoken (target 200–230 words for 90 s)`;
    document.getElementById("pitch-checks").innerHTML = PITCH_FLOW.map(p => { const hit = p.key.some(k => txt.includes(k)); return `<span class="check-pill ${hit ? "on" : ""}">${hit ? "✓" : "○"} ${esc(p.t)}</span>`; }).join("");
  };
  ta.addEventListener("input", analyse); analyse(); draw();
  document.getElementById("pitch-start").addEventListener("click", (e) => {
    if (pitchTimer) { clearInterval(pitchTimer); pitchTimer = null; e.currentTarget.textContent = "▶ Resume"; return; }
    e.currentTarget.textContent = "⏸ Pause"; ta.focus();
    pitchTimer = setInterval(() => { pitchLeft--; draw(); }, 1000);
  });
  document.getElementById("pitch-reset").addEventListener("click", () => { clearInterval(pitchTimer); pitchTimer = null; pitchLeft = 90; draw(); document.getElementById("pitch-start").textContent = "▶ Start 90-sec timer"; });
  document.getElementById("pitch-save").addEventListener("click", (e) => {
    const s2 = loadState(); s2.pitch.text = ta.value; if (ta.value.trim().length > 40) s2.pitch.practiced = true; saveState(s2); refreshProgress();
    e.currentTarget.textContent = ta.value.trim().length > 40 ? "✓ Saved & marked practiced" : "Write a little more first";
    setTimeout(() => { e.currentTarget.textContent = "✓ Save & mark practiced"; }, 1800);
  });
}
function renderCareer() {
  const rb = document.getElementById("resume-block");
  const text = `${RESUME_PROJECT.title}\n${RESUME_PROJECT.tools}\nKey Contributions\n${RESUME_PROJECT.bullets.map(b => "- " + b).join("\n")}`;
  rb.innerHTML = `<h3>${esc(RESUME_PROJECT.title)}</h3><div class="tools-line">${esc(RESUME_PROJECT.tools)}</div><strong style="font-size:13.5px;">Key Contributions</strong>
    <ul>${RESUME_PROJECT.bullets.map(b => `<li>${esc(b)}</li>`).join("")}</ul><div class="copy-row"><button class="btn-dark" id="copy-resume">📋 Copy Resume Description</button></div>`;
  document.getElementById("copy-resume").addEventListener("click", (e) => copyText(text, e.currentTarget, "📋 Copy Resume Description"));
  const bw = document.getElementById("resume-bullets");
  bw.innerHTML = RESUME_BULLETS.map((b, i) => `<div class="resume-bullet"><p>${esc(b)}</p><button type="button" class="copy-btn" data-i="${i}">📋 Copy</button></div>`).join("");
  bw.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => copyText(RESUME_BULLETS[+b.dataset.i], b, "📋 Copy")));
  document.getElementById("linkedin-post").textContent = LINKEDIN_POST;
  document.getElementById("copy-linkedin-btn").addEventListener("click", (e) => copyText(LINKEDIN_POST, e.currentTarget, "📋 Copy post"));
  document.getElementById("portfolio-grid").innerHTML = PORTFOLIO.map(t => `<div class="card tip-card"><div class="n">${t.n}</div><h4>${esc(t.h)}</h4><p>${esc(t.p)}</p></div>`).join("");
}
function renderGlossary(filterText) {
  const wrap = document.getElementById("gloss-grid"); const q = (filterText || "").trim().toLowerCase();
  const list = GLOSSARY.filter(g => !q || (g.t + g.d).toLowerCase().includes(q));
  wrap.innerHTML = list.length ? list.map(g => `<div class="card gloss-card" id="gl-${slugify(g.t)}"><h4>${esc(g.t)}</h4><p>${esc(g.d)}</p></div>`).join("") : `<div class="empty-state">No terms match that search.</div>`;
}
function renderTips() {
  document.getElementById("tip-grid").innerHTML = TIPS.map(t => `<div class="card tip-card"><div class="n">${t.n}</div><h4>${esc(t.h)}</h4><p>${esc(t.p)}</p></div>`).join("");
  document.getElementById("tip-callout").textContent = TIP_CALLOUT;
  document.getElementById("weak-strong-list").innerHTML = WEAK_STRONG.map(ws => `<div class="ws-card"><div class="ws-q">${esc(ws.q)}</div><div class="ws-grid">
    <div class="ws-col ws-weak"><div class="ws-label">✗ Weak answer</div><p>${esc(ws.weak)}</p></div>
    <div class="ws-col ws-strong"><div class="ws-label">✓ Strong answer</div><p>${esc(ws.strong)}</p></div></div></div>`).join("");
}
function renderLearningLinks() {
  document.getElementById("learn-grid").innerHTML = LEARNING_LINKS.map((l, i) => `<a class="learn-card tint-${i % 6}" href="${l.url}" target="_blank" rel="noopener"><span class="learn-source">${esc(l.source)}</span><h4>${esc(l.title)}</h4><p>${esc(l.desc)}</p><span class="learn-cta">Open resource ↗</span></a>`).join("");
}
function renderProgressPage() {
  const r = document.getElementById("reset-progress");
  if (r) r.addEventListener("click", () => {
    if (!confirm("Reset all journey steps, deliverables, assignments, lab answers and interview progress on this device?")) return;
    saveState({}); try { localStorage.removeItem(STORE_KEY); } catch (e) {}
    renderJourney(); renderChecklist("deliv-grid", DELIVERABLES, "deliv"); renderAssignments(); renderLab(); renderQaList(); renderQA(); refreshProgress();
  });
}

function renderSamples() {
  const g = document.getElementById("sample-grid");
  if (g) {
    g.innerHTML = SAMPLE_IMAGE_DASHBOARDS.map((d, i) => `
      <div class="card sample-card">
        <img src="${d.img}" alt="${esc(d.t)} by ${esc(d.by)}" data-zoom="${i}" loading="lazy">
        <div class="sample-body"><div class="sample-by">${esc(d.by)}</div><h4>${esc(d.t)}</h4>
          <p><strong>What it does:</strong> ${esc(d.does)}</p><p><strong>KPIs:</strong> ${esc(d.kpis)}</p>
          <p><strong>Visuals:</strong> ${esc(d.visuals)}</p><div class="sample-px">➜ ${esc(d.proxima)}</div></div>
      </div>`).join("");
    g.querySelectorAll("[data-zoom]").forEach(im => im.addEventListener("click", () => openModal(`<img class="zoom-img" src="${im.src}" alt="${esc(im.alt)}"><p style="font-size:12px;color:var(--ink-muted);margin-top:8px;">Sample design: ${esc(im.alt)}. Wireframe / concept for layout; use the KPI Library numbers in your build.</p>`)));
  }
  const w = document.getElementById("vidi-cards");
  if (w) {
    const li = (arr) => `<ul>${arr.map(x => `<li>${esc(x)}</li>`).join("")}</ul>`;
    w.innerHTML = VIDI_DASHBOARDS.map((d, i) => `
      <div class="dacc" id="dacc-${i}">
        <button class="dacc-head" aria-expanded="false">
          <span class="dacc-n">${String(i + 1).padStart(2, "0")}</span>
          <span class="dacc-t"><strong>${esc(d.name)}</strong><span>${esc(d.tag)}</span></span>
          <span class="dacc-tool">${esc(d.tool)}</span><span class="dacc-chev">⌄</span>
        </button>
        <div class="dacc-body">
          <p class="dacc-ctx">${esc(d.context)}</p>
          <div class="dacc-grid">
            <div><h5>📋 What it shows</h5><p>${esc(d.what)}</p></div>
            <div><h5>❓ Business question it answers</h5><p>${esc(d.question)}</p></div>
            <div><h5>👥 Who uses it</h5><p>${esc(d.who)}</p></div>
            <div><h5>🎛️ Filters / slicers</h5><p>${esc(d.filters)}</p></div>
            <div><h5>📊 Key KPIs</h5>${li(d.kpis)}</div>
            <div><h5>📈 Visuals</h5>${li(d.visuals)}</div>
          </div>
          <div class="dacc-build"><h5>🛠️ Build it with the AXon data</h5>${li(d.build)}</div>
          <div class="dacc-foot"><span class="dacc-insight">💡 AXon example: ${esc(d.proxima)}</span><span class="dacc-page">Gallery page: ${esc(d.page)}</span></div>
        </div>
      </div>`).join("");
    const setOpen = (card, open) => { card.classList.toggle("open", open); card.querySelector(".dacc-head").setAttribute("aria-expanded", open); };
    w.querySelectorAll(".dacc").forEach(c => c.querySelector(".dacc-head").addEventListener("click", () => setOpen(c, !c.classList.contains("open"))));
    const oa = document.getElementById("acc-open-all"), ca = document.getElementById("acc-close-all");
    if (oa) oa.addEventListener("click", () => w.querySelectorAll(".dacc").forEach(c => setOpen(c, true)));
    if (ca) ca.addEventListener("click", () => w.querySelectorAll(".dacc").forEach(c => setOpen(c, false)));
  }
}
function renderQaRefs() {
  const w = document.getElementById("qa-refs"); if (!w) return;
  w.innerHTML = QA_REFERENCES.map((s, i) => `<a class="learn-card tint-${i % 6}" href="${s[1]}" target="_blank" rel="noopener"><span class="learn-source">${esc(s[0].split(":")[0])}</span><h4>${esc(s[0].split(": ").slice(1).join(": ") || s[0])}</h4><span class="learn-cta">Open source ↗</span></a>`).join("");
}
function initBrandHome() {
  document.querySelectorAll("#brand-home, .brand-home-link").forEach(a => a.addEventListener("click", (e) => {
    e.preventDefault(); if (location.hash) history.replaceState(null, "", location.pathname); switchView("overview");
  }));
}

function renderTraps() {
  const g = document.getElementById("trap-grid"); if (g) g.innerHTML = INTERVIEW_TRAPS.map(([bad, good]) => `<div class="trap"><div class="tbad">❌ ${esc(bad)}</div><div class="tgood">✅ ${esc(good)}</div></div>`).join("");
  const p = document.getElementById("pres-list"); if (p) p.innerHTML = PRESENTATION.map(([n, t, s, d]) => `<div class="pres-row"><span class="pn">${n}</span><div><h4>${esc(t)} <em>${s}</em></h4><p>${esc(d)}</p></div></div>`).join("");
}
function renderCertificate() {
  const box = document.getElementById("cert-box"); if (!box) return;
  const { tracks, overall } = trackScores();
  const done = overall >= 100;
  box.innerHTML = `<h4>${done ? "🎉 CRM Analytics Capstone Completed" : "🏅 Completion certificate"}</h4>
    <div class="cert-ticks">${tracks.map(t => `<span class="${t.pct >= 100 ? "on" : ""}">${t.pct >= 100 ? "✓" : "○"} ${esc(t.name)}</span>`).join("")}</div>
    ${done ? `<div class="answer-row"><input type="text" id="cert-name" placeholder="Your full name"><button class="btn-blue" id="cert-print">Download certificate</button></div>`
           : `<p>Unlocks at 100%. You're at <strong>${overall}%</strong>: finish the journey, deliverables, assignments and interview practice.</p>`}`;
  const b = document.getElementById("cert-print");
  if (b) b.addEventListener("click", () => {
    const nm = (document.getElementById("cert-name").value || "").trim(); if (!nm) { chatToastMini("Type your name first."); return; }
    document.getElementById("print-sheet").innerHTML = `<div class="cert-print"><img src="assets/axon-logo.png" alt="" style="width:220px;border-radius:8px;"><h1>Certificate of Completion</h1><p>This certifies that</p><h2>${esc(nm)}</h2>
      <p>has completed the <strong>AXon CRM Analytics Capstone</strong>: data model, SQL, Excel, Tableau, Power BI, KPI implementation, QA reconciliation, business analysis and interview preparation.</p>
      <p style="margin-top:30px;">Mahendra Singh · CrackAnalytics &nbsp;|&nbsp; ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
      <p style="font-size:10px;color:#777;margin-top:20px;">Self-tracked completion on the AXon CRM Analytics learning hub.</p></div>`;
    setTimeout(() => window.print(), 80);
  });
}
/* ============================================================
   Navigation
   ============================================================ */
const LAST_VIEW_KEY = "axon_crm_last_view_v1";
const VIEW_LABELS = {
  progress: "My Progress", problem: "Problem & Business Questions", rules: "Rules & Regulations", dataset: "Dataset", model: "Data Model",
  datadict: "Data Dictionary", quality: "Data Quality", kpis: "KPI Library", sql: "SQL Lab", excel: "Excel Analysis", analysis: "Business Analysis",
  dashboards: "Dashboard Gallery", qa: "QA & Reconciliation", assignments: "Assignments", lab: "Analyst Thinking Lab", interview: "Interview Questions",
  pitch: "90-sec Project Pitch", career: "Resume, LinkedIn & Portfolio", glossary: "Glossary", tips: "Student Tips", learnmore: "Learn More",
};
function switchView(viewName) {
  if (viewName === "journey-anchor") {
    switchView("overview");
    setTimeout(() => { const j = document.getElementById("journey-anchor"); if (j) j.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    return;
  }
  document.querySelectorAll("#nav button").forEach(x => x.classList.toggle("active", x.dataset.view === viewName));
  document.querySelectorAll("section.view").forEach(v => v.classList.remove("active"));
  const section = document.getElementById("view-" + viewName);
  if (section) section.classList.add("active");
  window.scrollTo({ top: 0, behavior: "auto" });
  closeMobileSidebar();
  if (viewName !== "overview" && VIEW_LABELS[viewName]) lsSet(LAST_VIEW_KEY, JSON.stringify({ view: viewName, ts: Date.now() }));
  if (viewName === "overview") renderContinueBanner();
  if (viewName === "progress") refreshProgress();
}
function renderContinueBanner() {
  const wrap = document.getElementById("continue-banner"); if (!wrap) return;
  let saved = null; try { saved = JSON.parse(lsGet(LAST_VIEW_KEY)); } catch (e) {}
  if (!saved || !saved.view || !VIEW_LABELS[saved.view]) { wrap.style.display = "none"; return; }
  wrap.style.display = "flex";
  wrap.innerHTML = `<span class="continue-text">↩️ Continue where you left off: <strong>${VIEW_LABELS[saved.view]}</strong></span>
    <div class="continue-actions"><button type="button" class="continue-go">Continue →</button><button type="button" class="continue-dismiss" title="Dismiss">✕</button></div>`;
  wrap.querySelector(".continue-go").addEventListener("click", () => switchView(saved.view));
  wrap.querySelector(".continue-dismiss").addEventListener("click", () => { wrap.style.display = "none"; });
}
function initNav() {
  document.querySelectorAll("#nav button").forEach(b => b.addEventListener("click", () => switchView(b.dataset.view)));
  document.querySelectorAll("[data-goto]").forEach(b => b.addEventListener("click", () => switchView(b.dataset.goto)));
}
function closeMobileSidebar() {
  const sb = document.getElementById("sidebar"), sc = document.getElementById("scrim");
  if (sb) sb.classList.remove("open"); if (sc) sc.classList.remove("show");
}
function initMobileToggle() {
  const t = document.getElementById("mobile-toggle"), sb = document.getElementById("sidebar"), sc = document.getElementById("scrim");
  if (!t || !sb || !sc) return;
  t.addEventListener("click", () => { sb.classList.toggle("open"); sc.classList.toggle("show"); });
  sc.addEventListener("click", closeMobileSidebar);
}
function initSocial() {
  [["side-youtube", SOCIAL.youtube], ["side-medium", SOCIAL.medium], ["side-linkedin", SOCIAL.linkedin], ["social-youtube", SOCIAL.youtube],
   ["social-medium", SOCIAL.medium], ["social-linkedin", SOCIAL.linkedin], ["youtube-link", SOCIAL.youtube]].forEach(([id, url]) => { const e = document.getElementById(id); if (e && url) e.href = url; });
  const fl = document.querySelectorAll(".footer-links a"); if (fl[0]) fl[0].href = SOCIAL.linkedin; if (fl[1]) fl[1].href = SOCIAL.medium;
}

/* ---- Visitor counter (no external service) ---- */
let __visitorMemory = null;
function initVisitorCounter() {
  const e = document.getElementById("visitor-count"); if (!e) return;
  const SEED = "axon_crm_visits_seed_v1", CNT = "axon_crm_visits_count_v1";
  function tryStore(store) {
    let seed = parseInt(store.getItem(SEED) || "0", 10);
    if (!seed) { seed = 180 + Math.floor(Math.random() * 220); store.setItem(SEED, String(seed)); }
    let c = parseInt(store.getItem(CNT) || "0", 10) + 1; store.setItem(CNT, String(c)); return seed + c;
  }
  let total = null;
  try { total = tryStore(window.localStorage); } catch (er) {}
  if (total === null) { try { total = tryStore(window.sessionStorage); } catch (er) {} }
  if (total === null) { if (__visitorMemory === null) __visitorMemory = 180 + Math.floor(Math.random() * 220); total = ++__visitorMemory; }
  e.textContent = total.toLocaleString("en-IN");
}

function initSearch() {
  document.getElementById("kpi-search").addEventListener("input", (e) => { kpiSearch = e.target.value; renderKpiGrid(); });
  document.getElementById("qa-search").addEventListener("input", (e) => { qaSearch = e.target.value; renderQaList(); });
  document.getElementById("gl-search").addEventListener("input", (e) => renderGlossary(e.target.value));
  document.getElementById("dd-search").addEventListener("input", (e) => renderDataDictionary(e.target.value));
}

/* ============================================================
   Ask SIA — client-side search over the site's own content
   ============================================================ */
function buildChatIndex() {
  const idx = [];
  KPIS.forEach(k => idx.push({ type: "KPI", tab: "kpis", title: k.name, text: `${k.name} ${k.q} ${k.desc} ${k.plain} ${k.cat}`,
    answer: `<strong>${esc(k.name)}</strong> (${esc(k.cat)}): ${esc(k.q)}<br>${esc(k.desc)}<br><span class="src-tag">${esc(k.formula)}</span><br><em>Answer key: ${esc(k.v25)}</em>`,
    followups: ["Show the related SQL", "What's a common mistake here?"] }));
  QA.forEach(it => idx.push({ type: "Interview Q&A", tab: "interview", title: it.q, text: `${it.q} ${it.a} ${it.cat}`,
    answer: `<strong>${esc(it.q)}</strong><br>${it.a}<div class="chat-signal">Interviewer signal: ${esc(it.signal)}</div>`,
    followups: it.cat === "Scenario-Based" ? ["Give me another scenario question", "What's a common gotcha here?"] : ["Give me a scenario question", "What's a common mistake here?"] }));
  GLOSSARY.forEach(g => idx.push({ type: "Glossary", tab: "glossary", title: g.t, text: `${g.t} ${g.d}`, answer: `<strong>${esc(g.t)}</strong>: ${esc(g.d)}`, followups: ["Show the related KPI", "Any gotchas here?"] }));
  NULL_NOTES.forEach((n, i) => idx.push({ type: "Data Quality", tab: "quality", title: `Data quality note ${i + 1}`, text: `null blank quality quirk ${n}`, answer: `<strong>Data quality, expected blank / quirk</strong><br>${esc(n)}`, followups: ["What are the data model gotchas?"] }));
  GOTCHAS.forEach(g => idx.push({ type: "Gotcha", tab: "model", title: g.t, text: `gotcha trap mistake ${g.t} ${g.d}`, answer: `<strong>⚠️ Gotcha: ${esc(g.t)}</strong><br>${esc(g.d)}`, followups: ["What's another gotcha?", "Give me an interview question on this"] }));
  TIPS.forEach(t => idx.push({ type: "Student Tip", tab: "tips", title: t.h, text: `tip advice ${t.h} ${t.p}`, answer: `<strong>Tip: ${esc(t.h)}</strong><br>${esc(t.p)}`, followups: ["Give me another tip"] }));
  SQL_BLOCKS.forEach(b => idx.push({ type: "SQL", tab: "sql", title: b.title, text: `sql query ${b.title} ${b.desc}`, answer: `<strong>${esc(b.title)}</strong><br>${esc(b.desc)}<pre style="white-space:pre-wrap;font-size:11px;">${esc(b.sql.slice(0, 600))}${b.sql.length > 600 ? "…" : ""}</pre>`, followups: ["Open the SQL Lab"] }));
  return idx;
}
const STOPWORDS = new Set(["what","is","the","a","an","of","for","how","why","does","do","in","on","to","and","or","this","that","are","was","were","be","it","its","with","vs","versus","between","me","tell","explain","about","show","give"]);
function expandTokens(t) { const x = []; t.forEach(w => { if (SYNONYMS[w]) x.push(...SYNONYMS[w]); }); return t.concat(x.map(s => s.toLowerCase())); }
function tokenize(s) { return s.toLowerCase().replace(/[^a-z0-9%\s]/g, " ").split(/\s+/).filter(w => w && !STOPWORDS.has(w)); }
function findByExactTitle(title, index) { return index.find(e => e.title === title); }
function searchChatIndex(query, index) {
  const raw = tokenize(query); if (!raw.length) return [];
  const toks = expandTokens(raw); const ql = query.toLowerCase();
  return index.map(e => {
    const tl = e.title.toLowerCase(), xl = e.text.toLowerCase(); let s = 0;
    toks.forEach(t => { if (tl.includes(t)) s += 3; else if (xl.includes(t)) s += 1; });
    if (ql.length > 3 && tl.includes(ql)) s += 5; return { e, s };
  }).filter(r => r.s > 0).sort((a, b) => b.s - a.s).slice(0, 3).map(r => r.e);
}
let chatIndexCache = null, chatLastResults = [];
function chatAppendMessage(html, who) {
  const body = document.getElementById("chat-panel-body"); const row = el("div", "chat-msg " + who);
  row.innerHTML = `<div class="chat-bubble">${html}</div>`; body.appendChild(row); body.scrollTop = body.scrollHeight; return row;
}
function chatAppendFollowups(fu) {
  if (!fu || !fu.length) return; const body = document.getElementById("chat-panel-body"); const w = el("div", "chat-followups");
  fu.slice(0, 3).forEach(f => { const c = el("button", "chat-followup-chip", esc(f)); c.type = "button"; c.addEventListener("click", () => { chatAppendMessage(esc(f), "user"); setTimeout(() => chatAnswer(f), 150); }); w.appendChild(c); });
  body.appendChild(w); body.scrollTop = body.scrollHeight;
}
function chatTypingIndicator(show) {
  const body = document.getElementById("chat-panel-body"); let i = document.getElementById("chat-typing-indicator");
  if (show) { if (i) return; i = el("div", "chat-msg bot"); i.id = "chat-typing-indicator"; i.innerHTML = `<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>`; body.appendChild(i); body.scrollTop = body.scrollHeight; }
  else if (i) i.remove();
}
function chatFallback() {
  chatAppendMessage("I couldn't find a close match for that in the KPIs, interview prep, data model or glossary. Try a specific term, a KPI name or a table name, or one of these:", "bot");
  chatAppendFollowups(CHAT_POPULAR);
}
function chatAnswer(query) {
  if (!chatIndexCache) chatIndexCache = buildChatIndex();
  const bare = query.trim().toLowerCase().replace(/[?!.]/g, "");
  if (["why", "example", "give an example", "more"].includes(bare) && chatLastResults.length) query = chatLastResults[0].title;
  if (/open the sql lab/i.test(query)) { switchView("sql"); return; }
  if (/scenario question/i.test(query)) { const sc = QA.filter(q => q.cat === "Scenario-Based"); const p = sc[Math.floor(Math.random() * sc.length)]; query = p.q; }
  let forced = null;
  for (const r of INTENT_RULES) { if (r.re.test(query)) { forced = findByExactTitle(r.title, chatIndexCache); if (forced) break; } }
  const results = forced ? [forced] : searchChatIndex(query, chatIndexCache);
  if (!results.length) { chatFallback(); return; }
  chatLastResults = results;
  results.forEach(r => {
    const bid = "chat-a-" + Math.random().toString(36).slice(2, 9);
    const row = chatAppendMessage(`<div id="${bid}">${r.answer}</div><br><button type="button" class="chat-link-btn" data-tab="${r.tab}">Open ${VIEW_LABELS[r.tab] || r.tab} →</button><button type="button" class="chat-copy-btn">Copy</button>`, "bot");
    row.querySelector(".chat-link-btn").addEventListener("click", () => switchView(r.tab));
    const cb = row.querySelector(".chat-copy-btn"); cb.addEventListener("click", () => copyText(document.getElementById(bid).innerText, cb, "Copy"));
    chatAppendFollowups(r.followups);
  });
}
function initChatWidget() {
  const fab = document.getElementById("chat-fab"), panel = document.getElementById("chat-panel"), close = document.getElementById("chat-panel-close");
  const form = document.getElementById("chat-panel-form"), input = document.getElementById("chat-input"), label = document.getElementById("chat-fab-label");
  if (!fab || !panel || !form) return;
  fab.addEventListener("click", () => { panel.classList.toggle("open"); if (panel.classList.contains("open")) { input.focus(); if (label) label.classList.add("hide"); renderQuickReplies(); } });
  close.addEventListener("click", () => { panel.classList.remove("open"); if (label) label.classList.remove("hide"); });
  form.addEventListener("submit", (e) => { e.preventDefault(); const q = input.value.trim(); if (!q) return; chatAppendMessage(esc(q), "user"); input.value = ""; chatTypingIndicator(true); setTimeout(() => { chatTypingIndicator(false); chatAnswer(q); }, 450); });
}
function renderQuickReplies() {
  const w = document.getElementById("chat-quick-replies"); if (!w) return;
  const pick = [...QUICK_REPLY_POOL].sort(() => Math.random() - 0.5).slice(0, 5);
  w.innerHTML = pick.map(q => `<button type="button" data-quick="${esc(q)}">${esc(q)}</button>`).join("");
  w.querySelectorAll("button").forEach(b => b.addEventListener("click", () => { chatAppendMessage(esc(b.dataset.quick), "user"); setTimeout(() => chatAnswer(b.dataset.quick), 150); }));
}

/* ============================================================
   Bookmarks + deep links
   ============================================================ */
const BOOKMARK_KEY = "axon_crm_bookmarks_v1";
function getBookmarks() { try { const r = JSON.parse(lsGet(BOOKMARK_KEY)); return r && r.kpi && r.qa ? r : { kpi: {}, qa: {} }; } catch (e) { return { kpi: {}, qa: {} }; } }
function toggleBookmark(type, key) { const b = getBookmarks(); b[type][key] = !b[type][key]; if (!b[type][key]) delete b[type][key]; lsSet(BOOKMARK_KEY, JSON.stringify(b)); }
function copyDeepLink(type, key) {
  const url = `${location.origin}${location.pathname}#${type}=${encodeURIComponent(key)}`;
  copyText(url); chatToastMini(`Link to this ${type === "kpi" ? "KPI" : "question"} copied. Paste it anywhere to jump straight here.`);
}
function chatToastMini(msg) {
  let t = document.getElementById("mini-toast");
  if (!t) { t = el("div"); t.id = "mini-toast"; t.style.cssText = "position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:var(--ink);color:var(--paper);padding:10px 18px;border-radius:8px;font-size:12.5px;z-index:1000;box-shadow:0 8px 24px rgba(0,0,0,0.3);opacity:0;transition:opacity 0.25s;"; document.body.appendChild(t); }
  t.textContent = msg; t.style.opacity = "1"; clearTimeout(t._t); t._t = setTimeout(() => { t.style.opacity = "0"; }, 2400);
}
function handleDeepLink() {
  const hash = location.hash.slice(1); if (!hash) return;
  const [type, raw] = hash.split("="); if (!type || !raw) return;
  const val = decodeURIComponent(raw); const tab = { kpi: "kpis", qa: "interview", gl: "glossary" }[type]; if (!tab) return;
  switchView(tab);
  if (type === "kpi") { kpiActiveCat = "All"; renderKpiPills(); renderKpiGrid(); }
  if (type === "qa") { const it = QA.find(q => q.q === val); if (it) { qaActiveCat = it.cat; renderQaTabs(); renderQaList(); } }
  setTimeout(() => {
    const target = document.getElementById((type === "kpi" ? "kpi-" : type === "qa" ? "qa-" : "gl-") + slugify(val)); if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" }); target.classList.add("deep-link-flash");
    if (type === "qa") { target.classList.add("open"); const a = target.querySelector(".qa-a"); if (a) a.style.maxHeight = a.scrollHeight + "px"; }
    setTimeout(() => target.classList.remove("deep-link-flash"), 1900);
  }, 120);
}

/* ============================================================
   Dark mode + streak
   ============================================================ */
const THEME_KEY = "axon_crm_theme_v1";
function initThemeToggle() {
  const btn = document.getElementById("theme-toggle"), icon = document.getElementById("theme-toggle-icon"), label = document.getElementById("theme-toggle-label");
  if (!btn) return;
  const apply = (dark) => { document.body.classList.toggle("dark-mode", dark); if (icon) icon.textContent = dark ? "☀️" : "🌙"; if (label) label.textContent = dark ? "Light mode" : "Dark mode"; };
  const saved = lsGet(THEME_KEY);
  if (saved === "dark") apply(true);
  btn.addEventListener("click", () => { const d = !document.body.classList.contains("dark-mode"); apply(d); lsSet(THEME_KEY, d ? "dark" : "light"); });
}
const STREAK_KEY = "axon_crm_visit_days_v1";
function updateStreak() {
  const badge = document.getElementById("streak-badge"); if (!badge) return;
  let days = []; try { days = JSON.parse(lsGet(STREAK_KEY)) || []; } catch (e) {}
  const today = new Date().toISOString().slice(0, 10);
  if (!days.includes(today)) { days.push(today); lsSet(STREAK_KEY, JSON.stringify(days)); }
  const set = new Set(days); let streak = 0; const cur = new Date();
  while (set.has(cur.toISOString().slice(0, 10))) { streak++; cur.setDate(cur.getDate() - 1); }
  badge.innerHTML = `<span class="flame">🔥</span> <b>${streak}</b>-day study streak · ${days.length} total visit${days.length === 1 ? "" : "s"}`;
}

/* ============================================================
   Flashcard quiz
   ============================================================ */
let quizDeck = [], quizDeckType = "qa", quizIndex = 0, quizScore = { good: 0, again: 0 };
function shuffleArray(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function startQuiz(type) {
  let deck;
  if (type === "kpi") deck = KPIS.map(k => ({ q: k.name, a: `${esc(k.q)}<br>${esc(k.desc)}<code style="display:block;margin-top:8px;font-size:12px;">${esc(k.plain)}</code>`, cat: k.cat }));
  else if (type === "glossary") deck = GLOSSARY.map(g => ({ q: g.t, a: esc(g.d), cat: "Glossary" }));
  else { const bm = getBookmarks(); const st = QA.filter(q => bm.qa[q.q]); deck = st.length >= 5 ? st : QA; }
  quizDeck = shuffleArray(deck); quizDeckType = type || "qa"; quizIndex = 0; quizScore = { good: 0, again: 0 };
  document.getElementById("quiz-overlay").classList.add("open"); renderQuizCard();
}
function renderQuizCard() {
  const body = document.getElementById("quiz-body");
  if (quizIndex >= quizDeck.length) {
    const total = quizScore.good + quizScore.again;
    body.innerHTML = `<div class="quiz-done"><div class="big-score">${quizScore.good} / ${total}</div><p style="color:var(--ink-muted);font-size:13px;margin-bottom:20px;">marked "Got it" this round.</p><button class="btn-dark" id="quiz-restart">Run again</button></div>`;
    document.getElementById("quiz-restart").addEventListener("click", () => startQuiz(quizDeckType)); return;
  }
  const it = quizDeck[quizIndex]; const pct = Math.round(quizIndex / quizDeck.length * 100);
  body.innerHTML = `<div class="quiz-progress-row"><span>Card ${quizIndex + 1} of ${quizDeck.length}</span><span>${esc(it.cat)}</span></div>
    <div class="quiz-bar-outer"><div class="quiz-bar-inner" style="width:${pct}%;"></div></div>
    <div class="quiz-card-flip" id="quiz-flip"><div class="quiz-card-inner"><div class="quiz-face"><span class="tag-mini">${esc(it.cat)}</span><div class="qtxt">${esc(it.q)}</div><div class="hint">Tap the card to reveal the answer</div></div>
    <div class="quiz-face quiz-face-back"><div class="atxt">${it.a}</div></div></div></div>
    <div class="quiz-grade-row" id="quiz-grade-row" style="visibility:hidden;"><button class="grade-again" id="quiz-again">↺ Review again</button><button class="grade-good" id="quiz-good">✓ Got it</button></div>
    <div class="quiz-nav-row"><button id="quiz-skip">Skip →</button><span>${quizScore.good} got it · ${quizScore.again} to review</span></div>`;
  const flip = document.getElementById("quiz-flip"), gr = document.getElementById("quiz-grade-row");
  flip.addEventListener("click", () => { flip.classList.toggle("flipped"); gr.style.visibility = flip.classList.contains("flipped") ? "visible" : "hidden"; });
  document.getElementById("quiz-again").addEventListener("click", (e) => { e.stopPropagation(); quizScore.again++; quizIndex++; renderQuizCard(); });
  document.getElementById("quiz-good").addEventListener("click", (e) => { e.stopPropagation(); quizScore.good++; quizIndex++; renderQuizCard(); });
  document.getElementById("quiz-skip").addEventListener("click", () => { quizIndex++; renderQuizCard(); });
}
function initQuiz() {
  const ov = document.getElementById("quiz-overlay");
  document.getElementById("quiz-launch-btn").addEventListener("click", () => startQuiz("qa"));
  document.getElementById("quiz-close").addEventListener("click", () => ov.classList.remove("open"));
  ov.addEventListener("click", (e) => { if (e.target === ov) ov.classList.remove("open"); });
  document.getElementById("kpi-quiz-launch-btn").addEventListener("click", () => startQuiz("kpi"));
  document.getElementById("gl-quiz-launch-btn").addEventListener("click", () => startQuiz("glossary"));
}
function initStarredToggles() {
  const k = document.getElementById("kpi-starred-toggle"), q = document.getElementById("qa-starred-toggle");
  k.addEventListener("click", () => { kpiStarredOnly = !kpiStarredOnly; k.classList.toggle("active", kpiStarredOnly); renderKpiGrid(); });
  q.addEventListener("click", () => { qaStarredOnly = !qaStarredOnly; q.classList.toggle("active", qaStarredOnly); renderQaList(); });
}

/* ============================================================
   Command palette (Ctrl/Cmd + K)
   ============================================================ */
let cmdkIndex = null, cmdkActive = -1;
function buildCmdkIndex() {
  const idx = [{ type: "Page", label: "Go to Home & Roadmap", tab: "overview", action: "nav" }];
  Object.entries(VIEW_LABELS).forEach(([tab, label]) => idx.push({ type: "Page", label: "Go to " + label, tab, action: "nav" }));
  KPIS.forEach(k => idx.push({ type: "KPI", label: k.name, action: "kpi", key: k.name }));
  QA.forEach(q => idx.push({ type: "Q&A", label: q.q, action: "qa", key: q.q }));
  GLOSSARY.forEach(g => idx.push({ type: "Term", label: g.t, action: "gl", key: g.t }));
  assignments().forEach(a => idx.push({ type: "Assignment", label: a.t, tab: "assignments", action: "nav" }));
  return idx;
}
function openCmdk() { if (!cmdkIndex) cmdkIndex = buildCmdkIndex(); const ov = document.getElementById("cmdk-overlay"), inp = document.getElementById("cmdk-input"); ov.classList.add("open"); inp.value = ""; inp.focus(); renderCmdkResults(""); }
function closeCmdk() { document.getElementById("cmdk-overlay").classList.remove("open"); }
function renderCmdkResults(query) {
  const wrap = document.getElementById("cmdk-results"); const q = query.trim().toLowerCase();
  const results = !q ? cmdkIndex.filter(r => r.type === "Page") : cmdkIndex.filter(r => r.label.toLowerCase().includes(q)).slice(0, 30);
  cmdkActive = results.length ? 0 : -1;
  if (!results.length) { wrap.innerHTML = `<div class="cmdk-empty">No matches. Try a different term.</div>`; wrap._results = []; return; }
  wrap.innerHTML = results.map((r, i) => `<button class="cmdk-item${i === 0 ? " active" : ""}" data-idx="${i}"><span class="cmdk-type">${r.type}</span><span class="cmdk-label">${esc(r.label)}</span></button>`).join("");
  wrap.querySelectorAll(".cmdk-item").forEach(b => {
    b.addEventListener("click", () => selectCmdkResult(results[+b.dataset.idx]));
    b.addEventListener("mouseenter", () => { wrap.querySelectorAll(".cmdk-item").forEach(x => x.classList.remove("active")); b.classList.add("active"); cmdkActive = +b.dataset.idx; });
  });
  wrap._results = results;
}
function selectCmdkResult(r) {
  closeCmdk();
  if (r.action === "nav") { switchView(r.tab); return; }
  location.hash = r.action + "=" + encodeURIComponent(r.key); handleDeepLink();
}
function initCmdk() {
  const hint = document.getElementById("cmdk-fab-hint"), ov = document.getElementById("cmdk-overlay"), inp = document.getElementById("cmdk-input");
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const kl = document.getElementById("cmdk-kbd-label"); if (kl && isMac) kl.textContent = "⌘ K";
  if (hint) hint.addEventListener("click", openCmdk);
  ov.addEventListener("click", (e) => { if (e.target === ov) closeCmdk(); });
  document.addEventListener("keydown", (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key.toLowerCase() === "k") { e.preventDefault(); ov.classList.contains("open") ? closeCmdk() : openCmdk(); return; }
    if (!ov.classList.contains("open")) return;
    const results = document.getElementById("cmdk-results")._results || [];
    if (e.key === "Escape") closeCmdk();
    else if (e.key === "ArrowDown") { e.preventDefault(); cmdkActive = Math.min(cmdkActive + 1, results.length - 1); hl(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); cmdkActive = Math.max(cmdkActive - 1, 0); hl(); }
    else if (e.key === "Enter") { e.preventDefault(); if (results[cmdkActive]) selectCmdkResult(results[cmdkActive]); }
  });
  inp.addEventListener("input", () => renderCmdkResults(inp.value));
  function hl() { const w = document.getElementById("cmdk-results"); w.querySelectorAll(".cmdk-item").forEach((b, i) => b.classList.toggle("active", i === cmdkActive)); const a = w.querySelector(".cmdk-item.active"); if (a) a.scrollIntoView({ block: "nearest" }); }
}

/* ============================================================
   Printable starred cheat sheet
   ============================================================ */
function initCheatSheet() {
  const btn = document.getElementById("cheatsheet-btn"); if (!btn) return;
  btn.addEventListener("click", () => {
    const bm = getBookmarks(); const ks = KPIS.filter(k => bm.kpi[k.name]); const qs = QA.filter(q => bm.qa[q.q]);
    if (!ks.length && !qs.length) { chatToastMini("Star a few KPIs or questions first (tap ☆ on any card), then print your cheat sheet."); return; }
    document.getElementById("print-sheet").innerHTML = `<h1>AXon CRM Analytics: My Cheat Sheet</h1><p style="color:#666;font-size:11px;margin-bottom:16px;">Generated from starred items · ${new Date().toLocaleDateString()}</p>
      ${ks.length ? `<h3>KPIs (${ks.length})</h3>` + ks.map(k => `<div class="ps-item"><h4>${esc(k.name)}</h4><p>${esc(k.desc)}</p><code>${esc(k.plain)}</code></div>`).join("") : ""}
      ${qs.length ? `<h3 style="margin-top:16px;">Interview Questions (${qs.length})</h3>` + qs.map(q => `<div class="ps-item"><h4>${esc(q.q)}</h4><p>${q.a}</p></div>`).join("") : ""}`;
    setTimeout(() => window.print(), 80);
  });
}

/* ============================================================
   Boot — each step isolated so one failure doesn't stop the page
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const steps = [
    renderStats, renderJourney, () => renderChecklist("deliv-grid", DELIVERABLES, "deliv"), renderBeforeAfter, renderTools, renderDomainPrimer,
    renderDocuments, renderFlow, renderTimeline, renderProblem, renderRules, renderDataset, renderModel, renderDataDictionary, renderQuality,
    renderKpiPills, renderKpiGrid, renderSql, renderExcel, renderAnalysis, renderGallery, renderQA, renderAssignments, renderLab,
    renderQaTabs, renderQaList, renderPitch, renderCareer, renderGlossary, renderTips, renderLearningLinks, renderProgressPage,
    initNav, initMobileToggle, initSearch, initSocial, initChatWidget, initThemeToggle, updateStreak,
    initQuiz, initStarredToggles, initCmdk, initCheatSheet, initModal, renderSamples, renderQaRefs, initBrandHome, renderKpiTiers, renderTraps, refreshProgress, renderContinueBanner, handleDeepLink,
  ];
  steps.forEach(fn => { try { fn(); } catch (e) { console.error("Boot step failed:", fn.name || "(anonymous)", e); } });
  window.addEventListener("hashchange", handleDeepLink);
});
/* ============================================================
   One-page KPI cheat sheet (kept from the original AXon site)
   ============================================================ */
function printKpiCheatSheet() {
  const rows = ["Lead", "Opportunity"].map(cat => {
    const items = KPIS.filter(k => k.cat === cat).map(k => `
      <div class="cs-item"><div class="cs-name">${esc(k.name)} <span class="cs-tier">${k.prio}</span></div>
        <div class="cs-formula">${esc(k.formula)}</div><div class="cs-def">${esc(k.plain)} · <b>Answer: ${esc(k.v25)}</b></div></div>`).join("");
    return `<h2>${cat} Dashboard KPIs</h2><div class="cs-col">${items}</div>`;
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>AXon CRM Analytics — KPI Cheat Sheet</title>
  <style>@page { size: A4; margin: 10mm; } * { box-sizing: border-box; } body { font-family: Arial, Helvetica, sans-serif; color: #1A1D21; margin: 0; }
  .cs-header { text-align: center; margin-bottom: 10px; } .cs-header h1 { font-size: 16px; margin: 0 0 2px; } .cs-header p { font-size: 10px; color: #666; margin: 0; }
  .cs-wrap { column-count: 2; column-gap: 18px; } h2 { font-size: 12px; text-transform: uppercase; border-bottom: 1.5px solid #333; padding-bottom: 3px; margin: 10px 0 6px; break-after: avoid; }
  .cs-item { break-inside: avoid; margin-bottom: 6px; padding-bottom: 6px; border-bottom: 1px dotted #ccc; } .cs-name { font-size: 10.5px; font-weight: 700; }
  .cs-tier { font-size: 8px; background: #E6F3FA; color: #0A5A87; padding: 1px 4px; border-radius: 3px; } .cs-formula { font-family: 'Courier New', monospace; font-size: 9px; color: #0E6E9E; margin: 1px 0; }
  .cs-def { font-size: 9px; color: #444; line-height: 1.3; }</style></head><body>
  <div class="cs-header"><h1>AXon CRM Analytics — KPI Cheat Sheet (23 KPIs)</h1><p>by Mahendra Singh · CrackAnalytics · Win Rate = Won ÷ Closed · never sum Amount over line items</p></div>
  <div class="cs-wrap">${rows}</div></body></html>`;
  const win = window.open("", "_blank");
  if (!win) { chatToastMini("Please allow pop-ups to print the cheat sheet."); return; }
  win.document.open(); win.document.write(html); win.document.close(); win.focus();
  setTimeout(() => win.print(), 300);
}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("print-cheatsheet-btn");
  if (btn) btn.addEventListener("click", printKpiCheatSheet);
});
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("img.zoomable").forEach(img => img.addEventListener("click", () => openModal(`<img class="zoom-img" src="${img.src}" alt="${esc(img.alt)}">`)));
});
