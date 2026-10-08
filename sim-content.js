/* Job Simulator content: every number comes from this project's own answer keys and gotchas. */
window.SIM_CONTENT = {
 "site": "AXon CRM Analytics",
 "intro": {
  "incident": "Real alerts from AXon sales, marketing and finance leaders, each built on a trap this project teaches. Check the evidence, pick the root cause and the fix, then write the reply you would send.",
  "broken": "A junior analyst built this Lead & Opportunity dashboard from the Salesforce export. Find every tile that uses a wrong formula, filter or join before it reaches leadership.",
  "stakeholder": "AXon stakeholders rarely ask precise questions. Pick the clarifying questions that turn a vague request into a clear KPI spec, and skip the ones that waste their time."
 },
 "incidents": [
  {
   "id": "i1",
   "lvl": "Easy",
   "title": "“Our win rate dropped to 31%”",
   "from": "Vikram Desai · Sales Director",
   "time": "Mon 9:20 AM",
   "msg": "The new Power BI page shows our Win Rate at 31.06%. Last quarter's Excel report said 42.77%. Did the team suddenly get worse at closing? I need to explain this in the sales review today.",
   "metric": [
    [
     "Win Rate on the new page",
     "31.06%"
    ],
    [
     "Win Rate in the Excel report",
     "42.77%"
    ]
   ],
   "evidence": [
    {
     "id": "e1",
     "rel": true,
     "t": "Won, lost and open deals",
     "sql": "SELECT COUNT_IF(won)              AS won,\n       COUNT_IF(closed AND NOT won) AS lost,\n       COUNT_IF(NOT closed)         AS open_opps,\n       COUNT(*)                     AS all_opps\nFROM STG.fact_opportunity;",
     "res": [
      [
       "won",
       "1,443"
      ],
      [
       "lost",
       "1,931"
      ],
      [
       "open_opps",
       "1,272"
      ],
      [
       "all_opps",
       "4,646"
      ]
     ],
     "note": "1,443 ÷ 4,646 = 31.06%, but 1,272 of those deals are still open. 1,443 ÷ (1,443 + 1,931) = 42.77%."
    },
    {
     "id": "e2",
     "rel": true,
     "t": "Win % + Loss % check",
     "sql": "-- the new page's measures\nWin Rate  = DIVIDE([Won Opps],  [Total Opportunities])\nLoss Rate = DIVIDE([Lost Opps], [Total Opportunities])",
     "res": [
      [
       "Win Rate",
       "31.06%"
      ],
      [
       "Loss Rate",
       "41.56%"
      ],
      [
       "Win + Loss",
       "72.62%"
      ]
     ],
     "note": "Every closed deal is either won or lost, so Win % + Loss % should be 100%. Here it isn't."
    },
    {
     "id": "e3",
     "rel": true,
     "t": "Win rate by close year (closed deals only)",
     "sql": "SELECT YEAR(close_date),\n       ROUND(COUNT_IF(won) * 100.0 / COUNT_IF(closed), 1) AS win_rate\nFROM STG.fact_opportunity\nWHERE YEAR(close_date) IN (2020, 2021) GROUP BY 1;",
     "res": [
      [
       "2020",
       "42.0%"
      ],
      [
       "2021",
       "45.9%"
      ]
     ],
     "note": "Measured the right way, win rate went up, not down."
    },
    {
     "id": "e4",
     "rel": false,
     "t": "Soft-deleted opportunities",
     "sql": "SELECT COUNT(*) FROM RAW.opportunity WHERE \"Deleted\" = 'True';",
     "res": [
      [
       "opportunities in export",
       "4,646"
      ],
      [
       "deleted rows",
       "0"
      ]
     ],
     "note": "No deleted rows in this export. This doesn't explain the drop."
    }
   ],
   "causes": [
    [
     "c1",
     "The sales reps are closing fewer deals this quarter"
    ],
    [
     "c2",
     "Soft-deleted opportunities were included in the count"
    ],
    [
     "c3",
     "The measure divides won deals by ALL opportunities, including 1,272 that are still open, instead of by closed deals",
     true
    ],
    [
     "c4",
     "Blank Amounts were treated as lost deals"
    ],
    [
     "c5",
     "The Power BI dataset failed to refresh"
    ]
   ],
   "fixes": [
    [
     "f1",
     "Win Rate = DIVIDE([Won Opps], [Closed Opps]) → 42.77%, keep 31.06% only as a separate KPI called Opportunity Conversion Rate, and add a QA test that Win % + Loss % = 100%",
     true
    ],
    [
     "f2",
     "Remove open deals from the dataset"
    ],
    [
     "f3",
     "Use the Excel number and hide the Power BI card"
    ],
    [
     "f4",
     "Divide won deals by lost deals"
    ]
   ],
   "answer": "Root cause: the denominator. 1,443 won ÷ 4,646 all opportunities = 31.06%, which is Opportunity Conversion Rate. Win Rate uses closed deals only: 1,443 ÷ 3,374 = <b>42.77%</b>.",
   "tell": "“The team didn't get worse. The new page divided by all deals, including 1,272 that are still open. The real win rate is 42.77%, and by year it actually improved from 42.0% in 2020 to 45.9% in 2021. I've fixed the measure.”"
  },
  {
   "id": "i2",
   "lvl": "Easy",
   "title": "“Marketing says 907, Sales says 1,033”",
   "from": "Ananya Rao · Head of Marketing",
   "time": "Tue 11:15 AM",
   "msg": "My team's report shows 907 converted leads. Sales ops says 1,033. We can't both be right. Which number do I put in the quarterly marketing review?",
   "metric": [
    [
     "Marketing report",
     "907 converted leads"
    ],
    [
     "Sales ops report",
     "1,033 converted leads"
    ]
   ],
   "evidence": [
    {
     "id": "e1",
     "rel": true,
     "t": "Converted flag vs Status column",
     "sql": "SELECT COUNT_IF(\"Converted\" = 'True') AS converted_flag,\n       COUNT_IF(\"Status\" = 'Converted') AS status_converted\nFROM RAW.lead;",
     "res": [
      [
       "converted_flag",
       "1,033"
      ],
      [
       "status_converted",
       "907"
      ]
     ],
     "note": "The two columns disagree on 126 leads. Marketing used Status, Sales ops used the flag."
    },
    {
     "id": "e2",
     "rel": true,
     "t": "Data dictionary: Lead",
     "sql": "-- Data Dictionary → Lead",
     "res": [
      [
       "Converted",
       "set by Salesforce when a lead is actually converted"
      ],
      [
       "Status",
       "manually maintained picklist"
      ],
      [
       "Status (Simplified)",
       "'Open' on all 10,000 rows"
      ]
     ],
     "note": "The flag comes from the conversion process. Status is typed in by people and can fall out of sync."
    },
    {
     "id": "e3",
     "rel": true,
     "t": "Conversion rate both ways",
     "sql": "SELECT ROUND(COUNT_IF(is_converted) * 100.0 / COUNT(*), 2) FROM STG.fact_lead;",
     "res": [
      [
       "using the flag",
       "10.33%"
      ],
      [
       "using Status",
       "9.07%"
      ]
     ],
     "note": "The choice of column changes the headline KPI by more than a point."
    },
    {
     "id": "e4",
     "rel": false,
     "t": "Lead score coverage",
     "sql": "SELECT COUNT(lead_score), AVG(lead_score) FROM STG.fact_lead;",
     "res": [
      [
       "leads with a score",
       "603"
      ],
      [
       "avg score",
       "1.56"
      ]
     ],
     "note": "Low score coverage is a separate issue. It doesn't explain the conversion gap."
    }
   ],
   "causes": [
    [
     "c1",
     "126 leads were deleted from the marketing extract"
    ],
    [
     "c2",
     "Sales ops double-counted leads that merged into the same deal"
    ],
    [
     "c3",
     "Marketing counted Status = 'Converted', a manual picklist that is out of sync with Salesforce's Converted flag",
     true
    ],
    [
     "c4",
     "Leads from 2013–2015 were left out of one report"
    ],
    [
     "c5",
     "Status (Simplified) was used as a filter"
    ]
   ],
   "fixes": [
    [
     "f1",
     "Use the Converted flag for Converted Leads (1,033, conversion 10.33%), write that rule into the KPI library, and raise the Status mismatch with the Salesforce admin",
     true
    ],
    [
     "f2",
     "Average the two numbers"
    ],
    [
     "f3",
     "Filter on Status (Simplified) = 'Converted'"
    ],
    [
     "f4",
     "Report 907 because it is the more cautious number"
    ]
   ],
   "answer": "Root cause: two different columns. Status = 'Converted' (manual picklist) gives 907; the Converted flag set by Salesforce gives <b>1,033</b>, so the conversion rate is <b>10.33%</b>, not 9.07%.",
   "tell": "“Use 1,033. Your report read the Status picklist, which people update by hand and which is out of sync on 126 leads. The Converted flag is set by Salesforce itself. I've added this rule to the KPI library so both teams use the same number.”"
  },
  {
   "id": "i3",
   "lvl": "Medium",
   "title": "“Power BI is missing 123 deals”",
   "from": "Meera Krishnan · Sales Operations Manager",
   "time": "Wed 3:45 PM",
   "msg": "Salesforce says we have 4,646 opportunities. Your Power BI report shows 4,523. Finance noticed the gap and now doesn't trust any of the numbers. Where did the missing deals go?",
   "metric": [
    [
     "Salesforce",
     "4,646 opportunities"
    ],
    [
     "Power BI",
     "4,523 opportunities"
    ]
   ],
   "evidence": [
    {
     "id": "e1",
     "rel": true,
     "t": "Row counts layer by layer",
     "sql": "SELECT (SELECT COUNT(*) FROM RAW.opportunity)      AS raw_opps,\n       (SELECT COUNT(*) FROM STG.fact_opportunity) AS stg_opps;",
     "res": [
      [
       "raw_opps",
       "4,646"
      ],
      [
       "stg_opps",
       "4,646"
      ],
      [
       "Power BI card",
       "4,523"
      ]
     ],
     "note": "Nothing is lost in loading or staging. The rows disappear in the model."
    },
    {
     "id": "e2",
     "rel": true,
     "t": "Opportunities with no matching account",
     "sql": "SELECT COUNT(*) FROM STG.fact_opportunity o\nLEFT JOIN STG.dim_account a ON a.account_id = o.account_id\nWHERE a.account_id IS NULL;",
     "res": [
      [
       "opportunities in staging",
       "4,646"
      ],
      [
       "orphan opportunities",
       "123"
      ]
     ],
     "note": "4,646 − 4,523 = 123. Exactly the size of the gap."
    },
    {
     "id": "e3",
     "rel": true,
     "t": "Inner join vs left join to Account",
     "sql": "SELECT COUNT(*) FROM STG.fact_opportunity o\nJOIN STG.dim_account a ON a.account_id = o.account_id;   -- what the report does",
     "res": [
      [
       "INNER JOIN",
       "4,523 rows"
      ],
      [
       "LEFT JOIN",
       "4,646 rows"
      ]
     ],
     "note": "These 123 deals point to Account IDs that were not in the Account export. An inner join silently drops them."
    },
    {
     "id": "e4",
     "rel": false,
     "t": "Opportunities with no matching owner",
     "sql": "SELECT COUNT(*) FROM STG.fact_opportunity o\nLEFT JOIN STG.dim_user u ON u.user_id = o.owner_id\nWHERE u.user_id IS NULL;",
     "res": [
      [
       "opportunities checked",
       "4,646"
      ],
      [
       "orphan owners",
       "0"
      ]
     ],
     "note": "Every owner is found. The User join isn't the problem."
    }
   ],
   "causes": [
    [
     "c1",
     "The Power BI refresh stopped halfway"
    ],
    [
     "c2",
     "123 opportunities were soft-deleted in Salesforce"
    ],
    [
     "c3",
     "Duplicate opportunities were removed in staging"
    ],
    [
     "c4",
     "123 opportunities reference Account IDs missing from the Account export, and the model's inner join to Account drops them",
     true
    ],
    [
     "c5",
     "The Salesforce Reports connector row limit was hit"
    ]
   ],
   "fixes": [
    [
     "f1",
     "Use a LEFT JOIN in MART.vw_opp_summary with an 'Unknown account' member, log the 123 orphans in the Data Quality Log, and add a QA check that raw = staging = mart = 4,646",
     true
    ],
    [
     "f2",
     "Delete the 123 orphan opportunities from staging"
    ],
    [
     "f3",
     "Re-export everything from Salesforce and hope it matches"
    ],
    [
     "f4",
     "Add a note that Power BI is 'about right'"
    ]
   ],
   "answer": "Root cause: referential integrity. <b>123</b> opportunities point to Account IDs that aren't in the Account export, and the inner join to Account removed them: 4,646 − 123 = 4,523. With a LEFT JOIN the model keeps all <b>4,646</b>.",
   "tell": "“Salesforce is right: 4,646. 123 deals point to accounts that weren't in the export, and our model dropped them. I've switched to a left join with an 'Unknown account' bucket, logged the 123, and added a row-count check so this can't happen silently again.”"
  },
  {
   "id": "i4",
   "lvl": "Advanced",
   "title": "“Won revenue tripled overnight”",
   "from": "Rahul Bansal · Finance Controller",
   "time": "Thu 6:10 PM",
   "msg": "After a product slicer was added to the sales dashboard, the Won Revenue card shows $336.72M. Last month's report said $136.26M. Which number goes to the CFO?",
   "metric": [
    [
     "Dashboard after the change",
     "$336.72M"
    ],
    [
     "Last month's report",
     "$136.26M"
    ]
   ],
   "evidence": [
    {
     "id": "e1",
     "rel": true,
     "t": "Deals vs rows after the join",
     "sql": "-- won deals that have Opportunity Product rows,\n-- before and after joining STG.fact_opp_product",
     "res": [
      [
       "won deals with products",
       "1,207"
      ],
      [
       "rows after the join",
       "2,900"
      ]
     ],
     "note": "Each deal now appears about 2.4 times, once per product line."
    },
    {
     "id": "e2",
     "rel": true,
     "t": "Revenue three ways for the same deals",
     "sql": "WITH won_with_lines AS (\n  SELECT * FROM STG.fact_opportunity o\n  WHERE won AND EXISTS (SELECT 1 FROM STG.fact_opp_product p\n                        WHERE p.opportunity_id = o.opportunity_id)\n)\nSELECT\n  (SELECT SUM(amount) FROM won_with_lines)                    AS correct_deal_revenue,\n  (SELECT SUM(w.amount) FROM won_with_lines w\n     JOIN STG.fact_opp_product p ON p.opportunity_id = w.opportunity_id) AS wrong_joined_sum,\n  (SELECT SUM(p.total_price) FROM won_with_lines w\n     JOIN STG.fact_opp_product p ON p.opportunity_id = w.opportunity_id) AS product_line_revenue;",
     "res": [
      [
       "correct_deal_revenue",
       "$108.73M"
      ],
      [
       "wrong_joined_sum",
       "$336.72M"
      ],
      [
       "product_line_revenue",
       "$107.49M"
      ]
     ],
     "note": "Summing the deal Amount after the join is 3.1× too high. Summing Total Price per line gives a sensible figure."
    },
    {
     "id": "e3",
     "rel": true,
     "t": "Data model: table grain",
     "sql": "-- Data Model → grain",
     "res": [
      [
       "fact_opportunity",
       "1 row per opportunity (deal)"
      ],
      [
       "fact_opp_product",
       "1 row per product line on a deal"
      ]
     ],
     "note": "The product table has a lower grain, so the deal Amount repeats on every line."
    },
    {
     "id": "e4",
     "rel": false,
     "t": "Blank Amounts",
     "sql": "SELECT COUNT_IF(amount IS NULL), COUNT_IF(won AND amount IS NULL)\nFROM STG.fact_opportunity;",
     "res": [
      [
       "blank amount",
       "474"
      ],
      [
       "blank won amount",
       "14"
      ]
     ],
     "note": "Blank amounts make revenue lower, not higher. This doesn't explain a 3× jump."
    }
   ],
   "causes": [
    [
     "c1",
     "Several very large deals were won this month"
    ],
    [
     "c2",
     "Amount was cleaned twice, so '$' values were multiplied"
    ],
    [
     "c3",
     "Join fan-out: each won deal's Amount is repeated on every Opportunity Product line, so it is summed 2–3 times",
     true
    ],
    [
     "c4",
     "Open deals were included in Won Revenue"
    ],
    [
     "c5",
     "The Opportunity table has duplicate Opportunity IDs"
    ]
   ],
   "fixes": [
    [
     "f1",
     "Keep each fact at its own grain: Won Revenue = SUM(amount) from fact_opportunity, product views use total_price from fact_opp_product, and add a QA check that the KPI still equals $136.26M after any model change",
     true
    ],
    [
     "f2",
     "Divide the card by 3"
    ],
    [
     "f3",
     "Use SUM(DISTINCT amount)"
    ],
    [
     "f4",
     "Remove the product slicer and never show product revenue"
    ]
   ],
   "answer": "Root cause: join fan-out. 1,207 won deals became 2,900 rows after joining Opportunity Product, so their $108.73M was summed as $336.72M (3.1×). Total Won Revenue is still <b>$136.26M</b>.",
   "tell": "“Send $136.26M. The new slicer joined deals to their product lines, so each deal's amount was counted once per product. I've separated deal revenue from product revenue and added a check so the total can't change silently again.”"
  }
 ],
 "broken": {
  "from": "Sales Director",
  "brief": "“A junior analyst built this for tomorrow's leadership review. Something feels off. Flag every number you would NOT present, then submit.”",
  "title": "AXon · Lead & Opportunity Performance · as of 31-Dec-2021",
  "tiles": [
   {
    "id": "t1",
    "label": "Total Leads",
    "val": "10,000",
    "bad": false,
    "why": "Correct: COUNT(*) of fact_lead."
   },
   {
    "id": "t2",
    "label": "Lead Conversion Rate",
    "val": "10.33%",
    "bad": false,
    "why": "Correct: Converted flag (1,033) ÷ 10,000 leads."
   },
   {
    "id": "t3",
    "label": "Converted Opportunities",
    "val": "411",
    "bad": true,
    "why": "COUNT of conv_opp_id counts a deal once for every lead that merged into it. Correct (distinct, non-blank): 375."
   },
   {
    "id": "t4",
    "label": "Win Rate",
    "val": "46.76%",
    "bad": true,
    "why": "'Closed' was guessed as Won OR Closed Lost Reason filled, which misses the 293 lost deals with no reason. Correct (won ÷ closed, using the Closed flag): 42.77%."
   },
   {
    "id": "t5",
    "label": "Loss Rate",
    "val": "57.23%",
    "bad": false,
    "why": "Correct: lost ÷ closed. It adds to 100% only with the correct 42.77% win rate."
   },
   {
    "id": "t6",
    "label": "Total Won Revenue",
    "val": "$136.26M",
    "bad": false,
    "why": "Correct: SUM(amount) of won deals at deal grain."
   },
   {
    "id": "t7",
    "label": "Avg Deal Size (Won)",
    "val": "$94,429",
    "bad": true,
    "why": "The 14 won deals with a blank Amount were counted as $0. Correct (blanks excluded): $95,354."
   },
   {
    "id": "t8",
    "label": "Avg Days to Close (Won)",
    "val": "99.4 days",
    "bad": true,
    "why": "Includes 244 won deals whose Close Date is before their Created Date. Correct: exclude the negatives → 124.4 days (median 26 days)."
   },
   {
    "id": "t9",
    "label": "Active Opportunities",
    "val": "1,272",
    "bad": false,
    "why": "Correct: opportunities where Closed = FALSE."
   },
   {
    "id": "t10",
    "label": "Pipeline Value",
    "val": "$247.48M",
    "bad": true,
    "why": "This is raw open Amount with no probability weighting, and 772 open deals are already past their close date. Correct (weighted Expected Pipeline): $47.88M."
   }
  ],
  "chart": {
   "title": "Best lead sources to fund",
   "bars": [
    [
     "Inside Sales",
     "2,786 leads",
     100
    ],
    [
     "Website",
     "2,195 leads",
     79
    ],
    [
     "Trade Show",
     "1,610 leads",
     58
    ],
    [
     "Webinar",
     "1,091 leads",
     39
    ],
    [
     "Advertisement",
     "613 leads",
     22
    ],
    [
     "Field Sales",
     "577 leads",
     21
    ]
   ],
   "bad": true,
   "why": "The chart ranks sources by number of leads, not by quality. Inside Sales brings the most leads but converts only 1.3%. Ranked by conversion %: Field Sales 28.2%, Website 23.1%… Inside Sales is last."
  }
 },
 "stakeholders": [
  {
   "id": "s1",
   "who": "Vikram Desai · Sales Director",
   "ask": "I need a dashboard to see how my sales team is doing.",
   "qs": [
    [
     "What decision will this dashboard help you make?",
     "obj",
     18,
     "Which reps need coaching and where to focus next quarter's pipeline effort."
    ],
    [
     "Who will use it: you, the sales managers, or leadership?",
     "scope",
     14,
     "Me and the sales managers weekly. Leadership gets a one-page summary."
    ],
    [
     "What does 'doing well' mean: won revenue, win rate, or both?",
     "metric",
     18,
     "Both. Revenue for targets, win rate for coaching. The top-revenue rep isn't always the best closer."
    ],
    [
     "Should all reps be compared, or only those with enough closed deals?",
     "scope",
     10,
     "Only reps with at least 50 closed deals, so small numbers don't mislead."
    ],
    [
     "Which period, and should revenue follow Close Date or Created Date?",
     "time",
     16,
     "2020 vs 2021 on Close Date for revenue and win rate. Created Date only for pipeline created."
    ],
    [
     "How should Win Rate be calculated?",
     "rules",
     14,
     "Won ÷ closed deals. Open deals stay out of the denominator."
    ],
    [
     "Should 'Duplicate opportunity' losses count as real losses?",
     "rules",
     12,
     "Show the official win rate, and next to it the rate without duplicates, until we agree a rule."
    ],
    [
     "How often should it refresh?",
     "time",
     6,
     "Weekly, before the Monday sales meeting."
    ],
    [
     "Which colour should each rep be?",
     "bad",
     -8,
     "Doesn't matter now. (A question for later, not for scoping.)"
    ],
    [
     "Should I show every Opportunity column?",
     "bad",
     -8,
     "No, only what supports the decision."
    ],
    [
     "Can I build it from the Salesforce report export instead of Snowflake?",
     "bad",
     -6,
     "No. The Reports connector caps at 2,000 rows, and QA reconciles against Snowflake."
    ]
   ]
  },
  {
   "id": "s2",
   "who": "Ananya Rao · Head of Marketing",
   "ask": "Which lead sources should I spend more on? I need an answer before budget planning.",
   "qs": [
    [
     "What will you do differently depending on the answer?",
     "obj",
     18,
     "Move nurture budget away from sources that don't produce customers."
    ],
    [
     "Does 'good source' mean many leads, converted leads, or won revenue?",
     "metric",
     18,
     "Converted leads first, then won revenue. Volume alone isn't value."
    ],
    [
     "Should small sources be included, or only those with 100+ leads?",
     "scope",
     14,
     "Only 100+ leads, otherwise one lucky lead looks like a great source."
    ],
    [
     "Should I also show win rate of the deals those leads became?",
     "metric",
     12,
     "Yes. Sales says converted leads close less often than deals they create themselves."
    ],
    [
     "Which period: all years, or 2020–2021 where most leads are?",
     "time",
     16,
     "2020–2021, by quarter. Older years are too thin."
    ],
    [
     "Which field defines a converted lead: the Converted flag or Status?",
     "rules",
     14,
     "The Converted flag. Status is updated by hand and is out of sync."
    ],
    [
     "Should near-duplicate source names like 'Advertisement' and 'Advertisment' be merged?",
     "rules",
     8,
     "Yes, map them to one clean source before counting."
    ],
    [
     "Do you need it by industry too?",
     "scope",
     6,
     "Only as a filter, not a separate page."
    ],
    [
     "Can I fill blank lead scores with 0 so the chart looks complete?",
     "bad",
     -8,
     "No. Blank isn't zero. Show how many leads have a score instead."
    ],
    [
     "Should I use Status (Simplified) as the main filter?",
     "bad",
     -8,
     "No. It says 'Open' on every lead."
    ],
    [
     "Can I add a 3D funnel animation?",
     "bad",
     -6,
     "Not needed for this decision."
    ]
   ]
  },
  {
   "id": "s3",
   "who": "Rahul Bansal · Finance Controller",
   "ask": "Tell me how much revenue is in our pipeline.",
   "qs": [
    [
     "Is this for a forecast, a target, or a board update?",
     "obj",
     18,
     "Forecast: we're planning next year's revenue."
    ],
    [
     "Do you want raw open Amount or probability-weighted pipeline?",
     "metric",
     18,
     "Weighted. Show raw Amount only as context."
    ],
    [
     "Should deals already past their Close Date be included?",
     "metric",
     12,
     "Show them separately as 'stale' until sales updates them."
    ],
    [
     "Which deals count: open opportunities only, or won as well?",
     "scope",
     14,
     "Open only for pipeline. Won revenue is a separate number."
    ],
    [
     "Which as-of date and close period should I use?",
     "time",
     16,
     "As of 31-Dec-2021, grouped by expected close quarter."
    ],
    [
     "How should blank Amounts be handled?",
     "rules",
     14,
     "Keep them blank and report how many there are. Blank isn't $0."
    ],
    [
     "Should deals whose account is missing be kept?",
     "rules",
     10,
     "Yes, under 'Unknown account'. Totals must match Salesforce."
    ],
    [
     "Do you need it by owner or only in total?",
     "scope",
     8,
     "Total plus by sales manager."
    ],
    [
     "Can I round everything to the nearest billion?",
     "bad",
     -4,
     "No, millions with two decimals."
    ],
    [
     "Should I add product line totals to the deal amounts?",
     "bad",
     -8,
     "No. That double counts. Keep deal and product revenue apart."
    ],
    [
     "Can I skip QA to deliver faster?",
     "bad",
     -10,
     "No. Finance numbers must reconcile."
    ]
   ]
  }
 ]
};
