-- Direct INSERT statements for 20 CISA questions
-- Run this in Supabase SQL Editor if npm run seed fails

-- Temporarily disable RLS for inserting (re-enable after)
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;

-- Insert 20 questions
INSERT INTO questions (domain, q_text, choice_a, choice_b, choice_c, choice_d, answer, explanation) VALUES

-- Domain 1: Information Systems Auditing Process
(1, 'What is the PRIMARY purpose of an IS audit charter?',
 'To define the scope of individual audit engagements',
 'To establish the authority, responsibility, and accountability of the IS audit function',
 'To document audit findings and recommendations',
 'To ensure compliance with regulatory requirements',
 'B',
 'An IS audit charter establishes the authority, responsibility, and accountability of the IS audit function within the organization. It provides the formal mandate for audit activities and defines the role of the audit function.'),

(1, 'During an IS audit, which type of evidence is considered MOST reliable?',
 'Evidence obtained from internal sources',
 'Verbal statements from management',
 'Evidence generated independently by the auditor',
 'Documentation provided by the IT department',
 'C',
 'Evidence generated independently by the auditor through direct observation, examination, or recalculation is considered the most reliable because it is obtained firsthand without reliance on others and minimizes the risk of bias or manipulation.'),

(1, 'When should an IS auditor perform a risk assessment?',
 'Only at the end of the audit',
 'During the audit planning phase',
 'After fieldwork is completed',
 'During the reporting phase',
 'B',
 'Risk assessment should be performed during the audit planning phase to identify areas of highest risk that require audit attention. This ensures audit resources are allocated efficiently to areas with the greatest potential impact.'),

(1, 'What is the PRIMARY benefit of using Computer-Assisted Audit Techniques (CAATs)?',
 'Reduced audit costs',
 'Elimination of sampling risk',
 'Ability to test 100% of transactions efficiently',
 'Simplified audit documentation',
 'C',
 'CAATs enable auditors to efficiently analyze large volumes of data and test entire populations rather than samples. This provides more comprehensive audit coverage and can identify exceptions that might be missed through traditional sampling methods.'),

(1, 'Which of the following BEST describes the concept of audit independence?',
 'Auditors should report to the CFO',
 'Auditors should not have any prior relationship with the organization',
 'Auditors should be free from conflicts of interest that could impair objectivity',
 'Auditors should work alone without consulting others',
 'C',
 'Audit independence means auditors must be free from conflicts of interest and conditions that could impair their objectivity. This ensures unbiased audit opinions and maintains the credibility of the audit function.'),

-- Domain 2: IT Governance and Management
(2, 'Which framework is PRIMARILY focused on IT governance?',
 'ITIL',
 'COBIT',
 'ISO 27001',
 'CMMI',
 'B',
 'COBIT (Control Objectives for Information and Related Technologies) is specifically designed for IT governance and management. It provides a comprehensive framework for aligning IT with business objectives, managing IT risks, and ensuring value delivery from IT investments.'),

(2, 'What is the PRIMARY purpose of a service level agreement (SLA)?',
 'To define security requirements',
 'To establish measurable performance expectations between service provider and customer',
 'To document software requirements',
 'To outline disaster recovery procedures',
 'B',
 'An SLA establishes clear, measurable performance expectations between a service provider and customer. It defines service levels, responsibilities, metrics, and remedies for non-compliance, ensuring both parties understand expected service quality.'),

(2, 'Which of the following is the MOST important consideration when developing IT policies?',
 'Technical complexity',
 'Alignment with business objectives',
 'Industry best practices',
 'Cost of implementation',
 'B',
 'IT policies must align with business objectives to ensure IT supports organizational goals. While technical considerations and best practices are important, policies that do not support business needs will fail to deliver value and may not gain stakeholder support.'),

(2, 'What is the PRIMARY objective of IT risk management?',
 'To eliminate all IT-related risks',
 'To reduce IT costs',
 'To balance risk mitigation costs with potential impact',
 'To comply with regulations',
 'C',
 'IT risk management aims to balance the cost of risk mitigation with the potential impact of risks. Complete elimination of risk is neither possible nor cost-effective. The goal is to reduce risks to an acceptable level aligned with the organization''s risk appetite.'),

(2, 'Who should have PRIMARY responsibility for data classification?',
 'IT security team',
 'Data owners',
 'Database administrators',
 'External auditors',
 'B',
 'Data owners (typically business unit managers) have primary responsibility for classifying data because they understand the business context, sensitivity, and value of the data. They determine appropriate protection levels based on business requirements and regulatory obligations.'),

-- Domain 3: Information Systems Acquisition, Development, and Implementation
(3, 'What is the PRIMARY purpose of a feasibility study in the system development lifecycle?',
 'To test the system functionality',
 'To determine if the project is viable from technical, economic, and operational perspectives',
 'To train end users',
 'To deploy the system to production',
 'B',
 'A feasibility study evaluates whether a proposed system is viable from technical, economic, operational, and schedule perspectives. It helps management make informed decisions about whether to proceed with the project before significant resources are committed.'),

(3, 'During which phase of the SDLC should security requirements be FIRST addressed?',
 'Implementation phase',
 'Testing phase',
 'Requirements definition phase',
 'Maintenance phase',
 'C',
 'Security requirements should be identified and addressed during the requirements definition phase. Incorporating security from the beginning (security by design) is more effective and cost-efficient than adding it later in the development process.'),

(3, 'What is the PRIMARY advantage of prototyping in system development?',
 'It reduces development costs',
 'It eliminates the need for testing',
 'It allows users to visualize and refine requirements early',
 'It speeds up the deployment process',
 'C',
 'Prototyping allows users to interact with a working model early in development, helping clarify and refine requirements. This reduces the risk of building the wrong system and helps identify issues before significant development investment is made.'),

(3, 'Which type of testing should be performed FIRST in the testing hierarchy?',
 'User acceptance testing (UAT)',
 'Integration testing',
 'System testing',
 'Unit testing',
 'D',
 'Unit testing should be performed first as it tests individual components or modules in isolation. This follows the testing hierarchy from smallest to largest scope: unit → integration → system → acceptance testing.'),

(3, 'What is the MOST important control during the system migration to production?',
 'User training documentation',
 'Back-out procedures and rollback plan',
 'Performance monitoring tools',
 'System documentation',
 'B',
 'Back-out procedures and rollback plans are critical during production migration to ensure the organization can quickly revert to the previous system if critical issues arise. This minimizes business disruption and protects operational continuity.'),

-- Domain 4: Information Systems Operations and Business Resilience
(4, 'What is the PRIMARY objective of a business continuity plan (BCP)?',
 'To restore IT systems after a disaster',
 'To ensure critical business functions continue during and after a disruption',
 'To prevent all possible disasters',
 'To backup all data regularly',
 'B',
 'The primary objective of a BCP is to ensure critical business functions can continue during and after a disruption. While IT recovery is important, the BCP focuses on maintaining essential business operations to minimize impact on the organization.'),

(4, 'Which backup strategy provides the FASTEST recovery time?',
 'Full backup',
 'Incremental backup',
 'Differential backup',
 'Mirror/replication',
 'D',
 'Mirror or real-time replication provides the fastest recovery time as data is continuously synchronized to a secondary location. This enables near-instantaneous failover with minimal data loss, though it is typically the most expensive option.'),

(4, 'What is the MOST important consideration when selecting an alternate processing site for disaster recovery?',
 'Proximity to the primary site',
 'Distance from the primary site to avoid regional disasters',
 'Lowest cost option',
 'Availability of parking',
 'B',
 'The alternate site should be geographically distant from the primary site to avoid being affected by the same regional disaster (natural disasters, power outages, etc.). Sites too close together risk both being impacted by the same event.'),

(4, 'Which of the following BEST describes Recovery Time Objective (RTO)?',
 'Maximum acceptable time to restore a system after disruption',
 'Maximum acceptable amount of data loss',
 'Time required to perform a full backup',
 'Frequency of backup operations',
 'A',
 'RTO (Recovery Time Objective) is the maximum acceptable time to restore a business process or system after a disruption. It defines how quickly systems must be recovered to avoid unacceptable impacts to the business.'),

(4, 'What is the PRIMARY purpose of change management in IT operations?',
 'To speed up system deployments',
 'To minimize disruptions and ensure changes are properly evaluated and approved',
 'To reduce IT staffing costs',
 'To eliminate all system changes',
 'B',
 'Change management aims to minimize disruptions by ensuring changes are properly evaluated for risks, tested, approved by appropriate stakeholders, and implemented in a controlled manner. This reduces the likelihood of changes causing system failures or security vulnerabilities.');

-- Re-enable RLS after inserting
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Verify the insert
SELECT domain, COUNT(*) as count FROM questions GROUP BY domain ORDER BY domain;
SELECT COUNT(*) as total_questions FROM questions;
