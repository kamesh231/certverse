import { supabase } from '../lib/supabase.js';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  domain: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const cisaQuestions: Question[] = [
  {
    question: 'What is the primary purpose of an IT audit?',
    options: [
      'To ensure compliance with regulations',
      'To evaluate the effectiveness of IT controls and processes',
      'To reduce IT costs',
      'To implement new technologies'
    ],
    correct_answer: 'To evaluate the effectiveness of IT controls and processes',
    domain: 'IT Audit',
    difficulty: 'easy'
  },
  {
    question: 'Which of the following is a key component of risk management?',
    options: [
      'Risk avoidance only',
      'Risk identification, assessment, and mitigation',
      'Risk transfer only',
      'Risk acceptance only'
    ],
    correct_answer: 'Risk identification, assessment, and mitigation',
    domain: 'Risk Management',
    difficulty: 'medium'
  },
  {
    question: 'What is the main objective of access controls?',
    options: [
      'To prevent all access to systems',
      'To ensure only authorized users can access resources',
      'To speed up system performance',
      'To reduce storage costs'
    ],
    correct_answer: 'To ensure only authorized users can access resources',
    domain: 'Access Control',
    difficulty: 'easy'
  },
  {
    question: 'Which framework is commonly used for IT governance?',
    options: [
      'ISO 27001',
      'COBIT',
      'NIST',
      'PCI DSS'
    ],
    correct_answer: 'COBIT',
    domain: 'IT Governance',
    difficulty: 'medium'
  },
  {
    question: 'What does BCP stand for in IT security?',
    options: [
      'Business Continuity Planning',
      'Backup Control Protocol',
      'Basic Control Process',
      'Business Control Policy'
    ],
    correct_answer: 'Business Continuity Planning',
    domain: 'Business Continuity',
    difficulty: 'easy'
  },
  {
    question: 'Which type of testing is used to verify disaster recovery procedures?',
    options: [
      'Unit testing',
      'Integration testing',
      'Disaster recovery testing',
      'Performance testing'
    ],
    correct_answer: 'Disaster recovery testing',
    domain: 'Disaster Recovery',
    difficulty: 'medium'
  },
  {
    question: 'What is the purpose of change management?',
    options: [
      'To prevent all changes',
      'To control and track changes to IT systems',
      'To speed up development',
      'To reduce documentation'
    ],
    correct_answer: 'To control and track changes to IT systems',
    domain: 'Change Management',
    difficulty: 'easy'
  },
  {
    question: 'Which encryption method is considered most secure for data at rest?',
    options: [
      'AES-128',
      'AES-256',
      'DES',
      'MD5'
    ],
    correct_answer: 'AES-256',
    domain: 'Cryptography',
    difficulty: 'hard'
  },
  {
    question: 'What is the primary goal of incident response?',
    options: [
      'To prevent all incidents',
      'To minimize damage and restore normal operations quickly',
      'To assign blame',
      'To document failures'
    ],
    correct_answer: 'To minimize damage and restore normal operations quickly',
    domain: 'Incident Response',
    difficulty: 'medium'
  },
  {
    question: 'Which standard focuses on information security management?',
    options: [
      'ISO 9001',
      'ISO 27001',
      'ISO 14001',
      'ISO 20000'
    ],
    correct_answer: 'ISO 27001',
    domain: 'Information Security',
    difficulty: 'medium'
  },
  {
    question: 'What is the purpose of a security policy?',
    options: [
      'To restrict all access',
      'To provide guidelines and rules for security practices',
      'To document vulnerabilities',
      'To replace technical controls'
    ],
    correct_answer: 'To provide guidelines and rules for security practices',
    domain: 'Security Policy',
    difficulty: 'easy'
  },
  {
    question: 'Which type of attack involves intercepting communication between two parties?',
    options: [
      'DDoS attack',
      'Man-in-the-middle attack',
      'SQL injection',
      'Phishing'
    ],
    correct_answer: 'Man-in-the-middle attack',
    domain: 'Network Security',
    difficulty: 'hard'
  },
  {
    question: 'What is the role of an IS auditor in system development?',
    options: [
      'To develop the system',
      'To provide independent assurance and review',
      'To manage the project',
      'To write code'
    ],
    correct_answer: 'To provide independent assurance and review',
    domain: 'System Development',
    difficulty: 'medium'
  },
  {
    question: 'Which control type prevents unauthorized access?',
    options: [
      'Detective control',
      'Preventive control',
      'Corrective control',
      'Compensating control'
    ],
    correct_answer: 'Preventive control',
    domain: 'Internal Controls',
    difficulty: 'easy'
  },
  {
    question: 'What is data classification used for?',
    options: [
      'To organize files',
      'To determine appropriate security controls based on data sensitivity',
      'To reduce storage',
      'To improve performance'
    ],
    correct_answer: 'To determine appropriate security controls based on data sensitivity',
    domain: 'Data Management',
    difficulty: 'medium'
  },
  {
    question: 'Which protocol is used for secure web communication?',
    options: [
      'HTTP',
      'HTTPS',
      'FTP',
      'SMTP'
    ],
    correct_answer: 'HTTPS',
    domain: 'Network Security',
    difficulty: 'easy'
  },
  {
    question: 'What is the purpose of vulnerability assessment?',
    options: [
      'To exploit vulnerabilities',
      'To identify and evaluate security weaknesses',
      'To remove all vulnerabilities',
      'To document attacks'
    ],
    correct_answer: 'To identify and evaluate security weaknesses',
    domain: 'Vulnerability Management',
    difficulty: 'medium'
  },
  {
    question: 'Which principle ensures users can only access what they need?',
    options: [
      'Least privilege',
      'Maximum access',
      'Open access',
      'Shared access'
    ],
    correct_answer: 'Least privilege',
    domain: 'Access Control',
    difficulty: 'easy'
  },
  {
    question: 'What is the main purpose of log monitoring?',
    options: [
      'To reduce storage',
      'To detect security events and anomalies',
      'To improve performance',
      'To backup data'
    ],
    correct_answer: 'To detect security events and anomalies',
    domain: 'Security Monitoring',
    difficulty: 'medium'
  },
  {
    question: 'Which framework provides guidance for IT service management?',
    options: [
      'COBIT',
      'ITIL',
      'NIST',
      'ISO 27001'
    ],
    correct_answer: 'ITIL',
    domain: 'IT Service Management',
    difficulty: 'hard'
  }
];

async function seedQuestions() {
  console.log('Starting to seed questions...');

  for (const question of cisaQuestions) {
    const { data, error } = await supabase
      .from('questions')
      .insert(question)
      .select();

    if (error) {
      console.error(`Error inserting question: ${question.question}`, error);
    } else {
      console.log(`✓ Inserted question: ${question.question.substring(0, 50)}...`);
    }
  }

  console.log('Finished seeding questions!');
}

// Run seed if executed directly
// This will run when the file is executed via: npm run seed or tsx src/seed/questions.ts
seedQuestions()
  .then(() => {
    console.log('Seed completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

export { seedQuestions, cisaQuestions };

