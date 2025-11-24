import { supabase } from '../lib/supabase';

interface SeedQuestion {
  domain: number;
  q_text: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
}

// 20 CISA Practice Questions (5 per domain)
const questions: SeedQuestion[] = [
  // ============================================
  // DOMAIN 1: Information Systems Auditing Process (5 questions)
  // ============================================
  {
    domain: 1,
    q_text: 'What is the PRIMARY purpose of an IS audit charter?',
    choice_a: 'To define the scope of individual audit engagements',
    choice_b: 'To establish the authority, responsibility, and accountability of the IS audit function',
    choice_c: 'To document audit findings and recommendations',
    choice_d: 'To ensure compliance with regulatory requirements',
    answer: 'B',
    explanation: 'An IS audit charter establishes the authority, responsibility, and accountability of the IS audit function within the organization. It provides the formal mandate for audit activities and defines the role of the audit function.'
  },
  {
    domain: 1,
    q_text: 'During an IS audit, which type of evidence is considered MOST reliable?',
    choice_a: 'Evidence obtained from internal sources',
    choice_b: 'Verbal statements from management',
    choice_c: 'Evidence generated independently by the auditor',
    choice_d: 'Documentation provided by the IT department',
    answer: 'C',
    explanation: 'Evidence generated independently by the auditor through direct observation, examination, or recalculation is considered the most reliable because it is obtained firsthand without reliance on others and minimizes the risk of bias or manipulation.'
  },
  {
    domain: 1,
    q_text: 'When should an IS auditor perform a risk assessment?',
    choice_a: 'Only at the end of the audit',
    choice_b: 'During the audit planning phase',
    choice_c: 'After fieldwork is completed',
    choice_d: 'During the reporting phase',
    answer: 'B',
    explanation: 'Risk assessment should be performed during the audit planning phase to identify areas of highest risk that require audit attention. This ensures audit resources are allocated efficiently to areas with the greatest potential impact.'
  },
  {
    domain: 1,
    q_text: 'What is the PRIMARY benefit of using Computer-Assisted Audit Techniques (CAATs)?',
    choice_a: 'Reduced audit costs',
    choice_b: 'Elimination of sampling risk',
    choice_c: 'Ability to test 100% of transactions efficiently',
    choice_d: 'Simplified audit documentation',
    answer: 'C',
    explanation: 'CAATs enable auditors to efficiently analyze large volumes of data and test entire populations rather than samples. This provides more comprehensive audit coverage and can identify exceptions that might be missed through traditional sampling methods.'
  },
  {
    domain: 1,
    q_text: 'Which of the following BEST describes the concept of audit independence?',
    choice_a: 'Auditors should report to the CFO',
    choice_b: 'Auditors should not have any prior relationship with the organization',
    choice_c: 'Auditors should be free from conflicts of interest that could impair objectivity',
    choice_d: 'Auditors should work alone without consulting others',
    answer: 'C',
    explanation: 'Audit independence means auditors must be free from conflicts of interest and conditions that could impair their objectivity. This ensures unbiased audit opinions and maintains the credibility of the audit function.'
  },

  // ============================================
  // DOMAIN 2: IT Governance and Management (5 questions)
  // ============================================
  {
    domain: 2,
    q_text: 'Which framework is PRIMARILY focused on IT governance?',
    choice_a: 'ITIL',
    choice_b: 'COBIT',
    choice_c: 'ISO 27001',
    choice_d: 'CMMI',
    answer: 'B',
    explanation: 'COBIT (Control Objectives for Information and Related Technologies) is specifically designed for IT governance and management. It provides a comprehensive framework for aligning IT with business objectives, managing IT risks, and ensuring value delivery from IT investments.'
  },
  {
    domain: 2,
    q_text: 'What is the PRIMARY purpose of a service level agreement (SLA)?',
    choice_a: 'To define security requirements',
    choice_b: 'To establish measurable performance expectations between service provider and customer',
    choice_c: 'To document software requirements',
    choice_d: 'To outline disaster recovery procedures',
    answer: 'B',
    explanation: 'An SLA establishes clear, measurable performance expectations between a service provider and customer. It defines service levels, responsibilities, metrics, and remedies for non-compliance, ensuring both parties understand expected service quality.'
  },
  {
    domain: 2,
    q_text: 'Which of the following is the MOST important consideration when developing IT policies?',
    choice_a: 'Technical complexity',
    choice_b: 'Alignment with business objectives',
    choice_c: 'Industry best practices',
    choice_d: 'Cost of implementation',
    answer: 'B',
    explanation: 'IT policies must align with business objectives to ensure IT supports organizational goals. While technical considerations and best practices are important, policies that do not support business needs will fail to deliver value and may not gain stakeholder support.'
  },
  {
    domain: 2,
    q_text: 'What is the PRIMARY objective of IT risk management?',
    choice_a: 'To eliminate all IT-related risks',
    choice_b: 'To reduce IT costs',
    choice_c: 'To balance risk mitigation costs with potential impact',
    choice_d: 'To comply with regulations',
    answer: 'C',
    explanation: 'IT risk management aims to balance the cost of risk mitigation with the potential impact of risks. Complete elimination of risk is neither possible nor cost-effective. The goal is to reduce risks to an acceptable level aligned with the organization\'s risk appetite.'
  },
  {
    domain: 2,
    q_text: 'Who should have PRIMARY responsibility for data classification?',
    choice_a: 'IT security team',
    choice_b: 'Data owners',
    choice_c: 'Database administrators',
    choice_d: 'External auditors',
    answer: 'B',
    explanation: 'Data owners (typically business unit managers) have primary responsibility for classifying data because they understand the business context, sensitivity, and value of the data. They determine appropriate protection levels based on business requirements and regulatory obligations.'
  },

  // ============================================
  // DOMAIN 3: Information Systems Acquisition, Development, and Implementation (5 questions)
  // ============================================
  {
    domain: 3,
    q_text: 'What is the PRIMARY purpose of a feasibility study in the system development lifecycle?',
    choice_a: 'To test the system functionality',
    choice_b: 'To determine if the project is viable from technical, economic, and operational perspectives',
    choice_c: 'To train end users',
    choice_d: 'To deploy the system to production',
    answer: 'B',
    explanation: 'A feasibility study evaluates whether a proposed system is viable from technical, economic, operational, and schedule perspectives. It helps management make informed decisions about whether to proceed with the project before significant resources are committed.'
  },
  {
    domain: 3,
    q_text: 'During which phase of the SDLC should security requirements be FIRST addressed?',
    choice_a: 'Implementation phase',
    choice_b: 'Testing phase',
    choice_c: 'Requirements definition phase',
    choice_d: 'Maintenance phase',
    answer: 'C',
    explanation: 'Security requirements should be identified and addressed during the requirements definition phase. Incorporating security from the beginning (security by design) is more effective and cost-efficient than adding it later in the development process.'
  },
  {
    domain: 3,
    q_text: 'What is the PRIMARY advantage of prototyping in system development?',
    choice_a: 'It reduces development costs',
    choice_b: 'It eliminates the need for testing',
    choice_c: 'It allows users to visualize and refine requirements early',
    choice_d: 'It speeds up the deployment process',
    answer: 'C',
    explanation: 'Prototyping allows users to interact with a working model early in development, helping clarify and refine requirements. This reduces the risk of building the wrong system and helps identify issues before significant development investment is made.'
  },
  {
    domain: 3,
    q_text: 'Which type of testing should be performed FIRST in the testing hierarchy?',
    choice_a: 'User acceptance testing (UAT)',
    choice_b: 'Integration testing',
    choice_c: 'System testing',
    choice_d: 'Unit testing',
    answer: 'D',
    explanation: 'Unit testing should be performed first as it tests individual components or modules in isolation. This follows the testing hierarchy from smallest to largest scope: unit → integration → system → acceptance testing.'
  },
  {
    domain: 3,
    q_text: 'What is the MOST important control during the system migration to production?',
    choice_a: 'User training documentation',
    choice_b: 'Back-out procedures and rollback plan',
    choice_c: 'Performance monitoring tools',
    choice_d: 'System documentation',
    answer: 'B',
    explanation: 'Back-out procedures and rollback plans are critical during production migration to ensure the organization can quickly revert to the previous system if critical issues arise. This minimizes business disruption and protects operational continuity.'
  },

  // ============================================
  // DOMAIN 4: Information Systems Operations and Business Resilience (5 questions)
  // ============================================
  {
    domain: 4,
    q_text: 'What is the PRIMARY objective of a business continuity plan (BCP)?',
    choice_a: 'To restore IT systems after a disaster',
    choice_b: 'To ensure critical business functions continue during and after a disruption',
    choice_c: 'To prevent all possible disasters',
    choice_d: 'To backup all data regularly',
    answer: 'B',
    explanation: 'The primary objective of a BCP is to ensure critical business functions can continue during and after a disruption. While IT recovery is important, the BCP focuses on maintaining essential business operations to minimize impact on the organization.'
  },
  {
    domain: 4,
    q_text: 'Which backup strategy provides the FASTEST recovery time?',
    choice_a: 'Full backup',
    choice_b: 'Incremental backup',
    choice_c: 'Differential backup',
    choice_d: 'Mirror/replication',
    answer: 'D',
    explanation: 'Mirror or real-time replication provides the fastest recovery time as data is continuously synchronized to a secondary location. This enables near-instantaneous failover with minimal data loss, though it is typically the most expensive option.'
  },
  {
    domain: 4,
    q_text: 'What is the MOST important consideration when selecting an alternate processing site for disaster recovery?',
    choice_a: 'Proximity to the primary site',
    choice_b: 'Distance from the primary site to avoid regional disasters',
    choice_c: 'Lowest cost option',
    choice_d: 'Availability of parking',
    answer: 'B',
    explanation: 'The alternate site should be geographically distant from the primary site to avoid being affected by the same regional disaster (natural disasters, power outages, etc.). Sites too close together risk both being impacted by the same event.'
  },
  {
    domain: 4,
    q_text: 'Which of the following BEST describes Recovery Time Objective (RTO)?',
    choice_a: 'Maximum acceptable time to restore a system after disruption',
    choice_b: 'Maximum acceptable amount of data loss',
    choice_c: 'Time required to perform a full backup',
    choice_d: 'Frequency of backup operations',
    answer: 'A',
    explanation: 'RTO (Recovery Time Objective) is the maximum acceptable time to restore a business process or system after a disruption. It defines how quickly systems must be recovered to avoid unacceptable impacts to the business.'
  },
  {
    domain: 4,
    q_text: 'What is the PRIMARY purpose of change management in IT operations?',
    choice_a: 'To speed up system deployments',
    choice_b: 'To minimize disruptions and ensure changes are properly evaluated and approved',
    choice_c: 'To reduce IT staffing costs',
    choice_d: 'To eliminate all system changes',
    answer: 'B',
    explanation: 'Change management aims to minimize disruptions by ensuring changes are properly evaluated for risks, tested, approved by appropriate stakeholders, and implemented in a controlled manner. This reduces the likelihood of changes causing system failures or security vulnerabilities.'
  }
];

/**
 * Seed questions into the database
 */
async function seedQuestions() {
  console.log('🌱 Starting to seed questions...\n');

  try {
    // Check if questions already exist
    const { count, error: countError } = await supabase
      .from('questions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error checking existing questions:', countError);
      console.error('💡 Tip: Make sure your SUPABASE_SERVICE_KEY is set correctly in .env\n');
      process.exit(1);
    }

    if (count && count > 0) {
      console.log(`⚠️  Found ${count} existing questions in database.`);
      console.log('Do you want to:');
      console.log('1. Skip seeding (keep existing)');
      console.log('2. Delete all and reseed');
      console.log('\nPlease run with --force flag to delete and reseed: npm run seed -- --force\n');

      // Check for --force flag
      const forceFlag = process.argv.includes('--force');

      if (!forceFlag) {
        console.log('Seeding cancelled. Existing questions preserved.');
        process.exit(0);
      }

      // Delete existing questions
      console.log('🗑️  Deleting existing questions...');
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        console.error('❌ Error deleting existing questions:', deleteError);
        process.exit(1);
      }
      console.log('✅ Existing questions deleted\n');
    }

    // Insert new questions
    console.log(`📝 Inserting ${questions.length} questions...\n`);

    const { data, error } = await supabase
      .from('questions')
      .insert(questions)
      .select();

    if (error) {
      console.error('❌ Error inserting questions:', error);

      // Check if it's an RLS policy error
      if (error.code === '42501') {
        console.error('\n🔒 RLS Policy Error Detected!\n');
        console.error('This means Row Level Security is blocking the insert.');
        console.error('\n📋 Quick Fix Options:\n');
        console.error('Option 1 (Recommended for development):');
        console.error('  1. Go to Supabase Dashboard → SQL Editor');
        console.error('  2. Run: ALTER TABLE questions DISABLE ROW LEVEL SECURITY;');
        console.error('  3. Run seed again: npm run seed\n');
        console.error('Option 2 (Keep RLS enabled):');
        console.error('  1. Go to Supabase Dashboard → SQL Editor');
        console.error('  2. Copy and run: src/migrations/002_fix_insert_policy.sql');
        console.error('  3. Run seed again: npm run seed\n');
        console.error('Option 3 (Manual insert):');
        console.error('  1. Go to Supabase Dashboard → SQL Editor');
        console.error('  2. Run the INSERT statements from the seed file manually\n');
      }

      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data?.length || 0} questions!\n`);

    // Show breakdown by domain
    const domainCounts = [1, 2, 3, 4].map(domain => {
      const count = questions.filter(q => q.domain === domain).length;
      return `   Domain ${domain}: ${count} questions`;
    });

    console.log('📊 Breakdown by domain:');
    console.log(domainCounts.join('\n'));
    console.log('\n✨ Seeding complete!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Unexpected error during seeding:', error);
    process.exit(1);
  }
}

// Run the seed function
seedQuestions();
