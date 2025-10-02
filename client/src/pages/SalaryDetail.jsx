import React from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../util/api.js';

const INR = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export default function SalaryDetail(){
  const { slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const title = (state.title || slug.replace(/-/g,' ')).replace(/\b\w/g, c=>c.toUpperCase());
  const where = state.where || 'India';
  const avg = state.avg || 0;
  const [jobs, setJobs] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [period, setPeriod] = React.useState('Year');

  function converted(value, p){
    if (!value) return 0;
    switch(p){
      case 'Month': return value / 12;
      case 'Week': return value / 52;
      case 'Day': return value / 365;
      case 'Hour': return value / 2080; // 52 weeks * 40 hours
      case 'Year':
      default: return value;
    }
  }

  function goSeeJobs(){
    const params = new URLSearchParams();
    if (title) params.set('q', title);
    if (where) params.set('city', where);
    navigate(`/jobs${params.toString()?`?${params}`:''}`);
  }

  React.useEffect(()=>{
    // Try to load three jobs matching the title and city
    const params = new URLSearchParams();
    if (title) params.set('q', title);
    if (where) params.set('city', where);
    setLoading(true);
    api.get('/jobs' + (params.toString()?`?${params.toString()}`:''))
      .then(r => setJobs((r.jobs||[]).slice(0,3)))
      .catch(()=> setJobs([]))
      .finally(()=> setLoading(false));
  }, [title, where]);

  const qa = React.useMemo(()=>getInterviewQA(title), [title]);
  const [openIdx, setOpenIdx] = React.useState(0);

  return (
    <div className="fade-in" style={{maxWidth:1040, margin:'0 auto'}}>
      <section className="salary-hero" style={{padding:'2.2rem 0 1.2rem'}}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/" className="muted">Home</Link>
          <span aria-hidden>›</span>
          <Link to="/salary" className="muted">Career Explorer</Link>
          <span aria-hidden>›</span>
          <span>{title} Salary</span>
        </nav>
        <h1 style={{fontSize:'2rem',margin:'0 0 .35rem'}}>{title} salary in {where}</h1>
        <p className="muted" style={{margin:0}}>How much does a {title} make in {where}?</p>
      </section>

      <section>
        <div className="salary-summary card salary-summary-box">
          <div className="salary-avg-value">{avg ? INR.format(converted(avg, period)) : '—'}</div>
          <div className="salary-avg-meta">
            <label className="muted" style={{fontSize:'.85rem'}}>Pay per:</label>
            <select className="pay-select" value={period} onChange={e=>setPeriod(e.target.value)}>
              <option>Year</option>
              <option>Month</option>
              <option>Week</option>
              <option>Day</option>
              <option>Hour</option>
            </select>
          </div>
        </div>
        <p className="muted" style={{margin:'.6rem 0 1.4rem'}}>The average salary for a {title.toLowerCase()} is {avg?INR.format(converted(avg, period)):'—'} per {period.toLowerCase()} in {where}.</p>
      </section>

      <section>
        <div className="section-head">
          <h2 style={{margin:0}}>{title} job openings in {where}</h2>
          <button className="btn btn-sm" onClick={goSeeJobs}>See more jobs →</button>
        </div>
        <div className="job-cards-rail">
          {!loading && jobs.length===0 && (
            [0,1,2].map(i => (
              <div key={i} className="job-mini-card card" onClick={goSeeJobs}>
                <div style={{fontWeight:700}}>{title}</div>
                <div className="muted" style={{fontSize:'.8rem'}}>Multiple locations • Full-time</div>
                <div className="muted" style={{fontSize:'.75rem', marginTop:'.5rem'}}>Tap to view matching jobs</div>
              </div>
            ))
          )}
          {jobs.map(j => (
            <div key={j.id} className="job-mini-card card" onClick={()=>navigate(`/jobs/${j.id}`)}>
              <div style={{fontWeight:700}}>{j.title}</div>
              <div className="muted" style={{fontSize:'.8rem'}}>{j.institution_name || j.company_name || 'Institution'} • {j.city || j.location || 'Multiple'}</div>
              {j.salary && <div className="muted" style={{fontSize:'.8rem', marginTop:'.35rem'}}>{j.salary}</div>}
            </div>
          ))}
        </div>
      </section>

      <section style={{marginTop:'1.2rem'}}>
        <div className="card" style={{borderRadius:18}}>
          <div className="topic-head">
            <h2 style={{margin:0,fontSize:'1.2rem'}}>Interview Questions & Answers for {title}</h2>
            <p className="muted" style={{margin:0}}>Curated questions likely asked for this role. Prepare STAR-based responses and include measurable outcomes.</p>
          </div>
          <div className="accord" style={{marginTop:'.6rem'}}>
            {qa.map((item, idx) => (
              <div key={idx} className={`accord-item ${openIdx===idx?'open':''}`}>
                <button className="accord-q" onClick={()=>setOpenIdx(openIdx===idx? -1 : idx)} aria-expanded={openIdx===idx}>
                  <span>{item.q}</span>
                  <span aria-hidden>{openIdx===idx?'▴':'▾'}</span>
                </button>
                {openIdx===idx && (
                  <div className="accord-a">
                    <div>{item.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// Role-aware interview Q&A generator
function getInterviewQA(title){
  const t = (title||'').toLowerCase();
  const base = [
    { q:'Tell us about your teaching philosophy.', a:'Anchor on student-centered, inclusive, and outcomes-based learning. Emphasize active learning, formative assessment, and differentiation aligned to learning outcomes.' },
    { q:'How do you plan lessons and measure learning?', a:'Backward design: define outcomes, align assessments, then plan activities. Use rubrics, exit tickets, and low-stakes quizzes to close feedback loops.' },
    { q:'Describe classroom management strategies.', a:'Set co-created norms, predictable routines, and proactive engagement. Use non-escalatory redirection, restorative conversations, and tiered supports.' },
    { q:'How do you differentiate for diverse learners?', a:'Vary content, process, and product. Leverage UDL, choice boards, leveled texts, and assistive technologies; track progress with mastery grids.' },
    { q:'How do you integrate technology effectively?', a:'Apply SAMR/TPACK to keep tech purposeful. Use LMS for feedback, formative tools (e.g., quizzes), and analytics to personalize support.' },
    { q:'How do you communicate with parents/guardians?', a:'Establish regular updates, transparent grading, and solution-focused conversations. Document agreements and follow up with actionable next steps.' },
    { q:'Give an example of improving student outcomes.', a:'Use a STAR story: baseline data → targeted intervention (scaffolds, retrieval practice) → monitoring → outcome gains in marks/engagement/attendance.' },
    { q:'How do you ensure inclusivity and safeguarding?', a:'Comply with policies; implement UDL, trauma-informed practices, and clear reporting. Maintain safe boundaries and documentation.' },
    { q:'How do you handle conflicts or challenging behavior?', a:'Use de-escalation, restore relationships, and apply consistent consequences aligned with policy. Involve counselors and guardians when appropriate.' },
    { q:'How do you collaborate with colleagues?', a:'Contribute to PLCs, share resources, co-plan assessments, and participate in peer observations with feedback cycles.' },
  ];

  const add = (arr) => base.concat(arr).slice(0,15);

  // Subject-specific first (more precise)
  if (/\b(math|mathematics)\b/.test(t)) return add([
    { q:'How do you teach problem solving beyond procedures?', a:'Use Polya’s steps, multiple representations, and low-floor high-ceiling tasks; emphasize reasoning and justification.' },
    { q:'How do you build conceptual understanding of algebra?', a:'Concrete → pictorial → abstract; manipulatives, visual patterns, and linking graphs to equations.' },
    { q:'Assessment strategy in math classes?', a:'Spiraled quizzes, error analysis, rich tasks scored with rubrics, and mastery tracking by standards.' },
    { q:'How do you support math-anxious students?', a:'Normalize mistakes, use growth mindset language, scaffold entry points, and celebrate strategy diversity.' },
  ]);

  if (/\b(physics)\b/.test(t)) return add([
    { q:'How do you teach counterintuitive physics concepts?', a:'Elicit misconceptions, use demos/sims, predict–observe–explain cycles, and real-world analogies.' },
    { q:'Lab safety and assessment?', a:'Brief safety contracts, PPE, risk assessment, and rubrics for design, accuracy, and reflection.' },
    { q:'How do you connect math and physics rigor?', a:'Dimensional analysis, vector reasoning, and graphs-of-graphs; scaffold calculus where appropriate.' },
  ]);

  if (/\b(chemistry|chemical)\b/.test(t)) return add([
    { q:'How do you teach abstract chemical concepts?', a:'Particle models, animations, and macro–submicro–symbolic triangle alignment with worked examples.' },
    { q:'Practical work & safety in lab?', a:'SOPs, MSDS familiarity, fume hood use, waste disposal, and near-miss reporting culture.' },
    { q:'Assessment of stoichiometry and reactions?', a:'Representation translation tasks, limiting reagents problem sets, and error analysis of titration data.' },
  ]);

  if (/\b(biology|life science)\b/.test(t)) return add([
    { q:'How do you make cell biology concrete?', a:'Scale comparisons, models, microscopy, and analogies while warning of their limits.' },
    { q:'Bioethics in curriculum?', a:'Case studies (CRISPR, cloning), stakeholder debate, and citation of guidelines.' },
    { q:'Fieldwork/project assessment?', a:'Hypothesis framing, data logs, statistical summaries, and reflective journals.' },
  ]);

  if (/\b(computer\s*science|cs|programming|information technology)\b/.test(t)) return add([
    { q:'How do you teach algorithms to novices?', a:'Use visual traces, Parsons problems, and PRIMM (Predict–Run–Investigate–Modify–Make).' },
    { q:'Assessment of code without promoting plagiarism?', a:'Oral code walkthroughs, randomized parameters, unit tests, and process artifacts (design docs).' },
    { q:'Tools and classroom workflow?', a:'Git/GitHub for versioning, automated tests, IDE setup checklists, and pair programming norms.' },
  ]);

  if (/\b(english)\b/.test(t)) return add([
    { q:'Balancing literature and language skills?', a:'Close reading, authorial intent vs. reader response, grammar in context, and authentic writing tasks.' },
    { q:'Speaking/listening assessment?', a:'Structured discussions, presentations with rubrics, and recorded reflections.' },
    { q:'Reading interventions?', a:'Reciprocal teaching, vocabulary notebooks, and fluency practice.' },
  ]);

  if (/\b(hindi)\b/.test(t)) return add([
    { q:'LSRW approach in Hindi teaching?', a:'Integrate listening, speaking, reading, writing with culturally relevant materials and dialogues.' },
    { q:'Grammar pedagogy?', a:'Inductive discovery of rules through examples; reinforce with usage tasks and feedback.' },
    { q:'Assessment methods?', a:'Dictation, reading comprehension, oral proficiency checks, and writing portfolios.' },
  ]);

  if (/\b(social\s*science|social studies|civics)\b/.test(t)) return add([
    { q:'How do you encourage civic thinking?', a:'Socratic seminars, case studies, role-plays, and source evaluation.' },
    { q:'Integrating history–civics–geography?', a:'Thematic units with maps, timelines, and policy analysis projects.' },
    { q:'Assessment of argumentation?', a:'Claim–evidence–reasoning rubrics and debate scoring.' },
  ]);

  if (/\b(economics)\b/.test(t)) return add([
    { q:'Teaching micro vs. macro effectively?', a:'Use local market caselets for micro; policy dashboards and time series for macro.' },
    { q:'Data literacy in economics?', a:'Read charts critically, CPI/GDP interpretation, and simple regressions or elasticity estimation.' },
    { q:'Assessment design?', a:'Scenario-based items, graph interpretation, and short policy memos.' },
  ]);

  if (/\b(accountancy|accounts|accounting)\b/.test(t)) return add([
    { q:'Core concepts to test routinely?', a:'Journal → ledger → trial balance flow, depreciation methods, and bank reconciliation.' },
    { q:'Practical assignments?', a:'Voucher analysis, computerized accounting (Tally/ERP), and GST basics contextualized.' },
    { q:'Error analysis in accounting?', a:'Suspense accounts, rectification entries, and documentation of corrections.' },
  ]);

  if (/\b(history)\b/.test(t)) return add([
    { q:'Teaching historical thinking?', a:'Primary vs. secondary sources, corroboration, sourcing, and historiography vignettes.' },
    { q:'Projects and assessments?', a:'Document-based questions (DBQs), timelines, and local history field studies.' },
    { q:'Handling sensitive topics?', a:'Set norms, present multiple perspectives, and ground in evidence.' },
  ]);

  if (/\b(geography)\b/.test(t)) return add([
    { q:'Geo-skills to emphasize?', a:'Map reading, scale, contours, and satellite imagery interpretation.' },
    { q:'Tools and fieldwork?', a:'GIS basics (QGIS), GPS use, and simple field surveys with data mapping.' },
    { q:'Assessment ideas?', a:'Atlas tasks, case studies on urbanization/climate, and infographics.' },
  ]);

  if (/\b(prt|primary|elementary)\b/.test(t)) return add([
    { q:'How do you teach foundational literacy and numeracy?', a:'Use phonics, decodable readers, number sense routines, manipulatives, and frequent checks for understanding.' },
    { q:'How do you keep young learners engaged?', a:'Short, varied tasks, movement breaks, songs, stories, and visual schedules to sustain attention.' },
    { q:'How do you assess without causing anxiety?', a:'Anecdotal notes, observation checklists, station-based assessment, and portfolios.' },
  ]);

  if (/\b(tgt|middle|secondary|high school)\b/.test(t)) return add([
    { q:'How do you align to board curriculum (CBSE/ICSE/State)?', a:'Map yearly plan to board syllabus, integrate sample papers, and scaffold for board-style questions.' },
    { q:'How do you teach higher-order thinking?', a:'Use Bloom’s analysis/evaluation tasks, Socratic questioning, and project-based learning with rubrics.' },
    { q:'How do you prepare students for board exams?', a:'Spiral revision, past papers, timed practice, and error analysis dashboards.' },
  ]);

  if (/\b(pgt|senior secondary)\b/.test(t)) return add([
    { q:'How do you deepen subject rigor?', a:'Concept mapping, multi-step problems, seminars, and peer review to promote disciplinary thinking.' },
    { q:'How do you support competitive exam prep?', a:'Data-driven gap analysis, spaced retrieval, and targeted practice sets with analytics.' },
    { q:'How do you mentor toppers and lagging learners?', a:'Tiered goals, office hours, enrichment tasks, and targeted scaffolds.' },
  ]);

  if (/assistant professor|associate professor|professor|lecturer|senior lecturer/.test(t)) return add([
    { q:'What’s your approach to Outcome Based Education (OBE)?', a:'Define POs/PSOs/COs, map to curriculum, design aligned assessments, and close the loop with analytics and improvements.' },
    { q:'How do you balance teaching and research?', a:'Block research sprints, align projects with teaching, mentor students, and publish in targeted venues.' },
    { q:'How do you design assessments at UG/PG level?', a:'Blueprinting by COs, rubrics, moderation, and item analysis to ensure reliability and validity.' },
    { q:'Experience with NAAC/NBA accreditation?', a:'Evidence collection, metric ownership, IQAC coordination, and continuous quality improvement artifacts.' },
    { q:'How do you supervise projects/dissertations?', a:'Milestone plans, ethics approvals, reproducible workflows, and timely feedback.' },
  ]);

  if (/jrf|srf|postdoc|research assistant|postdoctoral|research fellow/.test(t)) return add([
    { q:'Describe your research question and methodology.', a:'State problem, prior work, hypothesis, design, and analysis plan; justify choices.' },
    { q:'How will you ensure research ethics and reproducibility?', a:'IRB/IEC approvals, preregistration, data dictionaries, version control, and open materials where permitted.' },
    { q:'What’s your publication strategy?', a:'Target journals, conference pipeline, authorship plan, and realistic timelines.' },
    { q:'How do you manage data?', a:'Use DMP, secure storage, anonymization, and backups; comply with policy.' },
    { q:'Grant writing experience?', a:'Need statement, objectives, methodology, budget, outcomes, and sustainability plan.' },
  ]);

  if (/hod|head of department|dean|principal|vice chancellor|registrar|academic director/.test(t)) return add([
    { q:'How do you build and execute department strategy?', a:'SWOT → OKRs → initiatives; review via dashboards and regular cadences.' },
    { q:'Budgeting and resource allocation approach?', a:'Zero-based/priority-based budgeting tied to outcomes; transparent tracking and audits.' },
    { q:'Quality and accreditation leadership?', a:'Own KPIs, drive IQAC/NBA processes, and institutionalize CQI.' },
    { q:'Handling stakeholder conflicts?', a:'Principle-based mediation, documentation, policy compliance, and follow-through.' },
    { q:'Data and governance practices?', a:'ERP discipline, MIS accuracy, privacy, and evidence-driven decisions.' },
  ]);

  if (/instructional designer|curriculum developer/.test(t)) return add([
    { q:'Explain your design framework (ADDIE/Backward Design).', a:'Analyze learners, define outcomes, prototype, iterate, and evaluate with measurable KPIs.' },
    { q:'How do you ensure alignment of outcomes, content, and assessment?', a:'Outcome mapping, blueprinting, and rubrics; pilot and iterate from data.' },
    { q:'Storyboarding and media choices?', a:'Use accessibility-first storyboards, chunking, and narration best practices.' },
    { q:'LMS and standards (SCORM/xAPI)?', a:'Package content for interoperability, track learning data, and automate nudges.' },
  ]);

  if (/placement officer|admissions counselor|admissions|placement/.test(t)) return add([
    { q:'Walk through your admissions/placement funnel.', a:'Define stages, conversion rates, CAC, and improve via A/B testing and targeted outreach.' },
    { q:'Tools and CRM experience?', a:'Lead capture, segmentation, campaigns, and MIS reporting; ensure data hygiene.' },
    { q:'Employer/partner engagement?', a:'Account plans, cadence calendars, MoUs, and feedback loops to improve match quality.' },
  ]);

  if (/librarian/.test(t)) return add([
    { q:'Cataloging and classification systems used?', a:'DDC, MARC, LCSH; authority control and metadata quality.' },
    { q:'E-resources and digital library tools?', a:'Koha/DSpace, discovery layers, remote access, and usage analytics.' },
    { q:'Information literacy instruction?', a:'Workshops on search strategies, citation managers, and academic integrity.' },
  ]);

  if (/physical education|pe instructor|sports/.test(t)) return add([
    { q:'How do you ensure safety and injury prevention?', a:'Warm-ups, progression, equipment checks, and first-aid protocols.' },
    { q:'Fitness assessment approach?', a:'Baseline tests, SMART goals, individualized plans, and periodic reassessment.' },
    { q:'Inclusive participation strategies?', a:'Modified activities, peer support, and positive reinforcement to engage all students.' },
  ]);

  if (/language instructor|english|hindi|language/.test(t)) return add([
    { q:'What methodology do you use (e.g., CLT)?', a:'Communicative Language Teaching with task-based activities and real-life contexts.' },
    { q:'How do you assess speaking and listening?', a:'Rubrics for fluency, accuracy, and interaction; use recordings and peer feedback.' },
    { q:'Handling mixed proficiency levels?', a:'Tiered tasks, pairings, and differentiated materials; focus on comprehensible input.' },
  ]);

  if (/academic counselor|career counselor|counselor/.test(t)) return add([
    { q:'Counseling frameworks and ethics?', a:'Solution-focused/CBT techniques; confidentiality, informed consent, and referral protocols.' },
    { q:'Career guidance process?', a:'Aptitude/interest mapping, labor market info, and individualized action plans.' },
    { q:'Handling crisis or escalation?', a:'Risk assessment, documentation, guardianship coordination, and professional referrals.' },
  ]);

  if (/education consultant|consultant/.test(t)) return add([
    { q:'How do you run a needs assessment?', a:'Stakeholder interviews, data audits, gap analysis, and prioritized recommendations.' },
    { q:'Change management in schools/universities?', a:'ADKAR principles, pilot programs, training plans, and success metrics.' },
    { q:'Policy and compliance expertise?', a:'Map policies to processes, audits, and remediation plans with sign-offs.' },
  ]);

  // Default general teacher set
  return base.slice(0,12);
}
