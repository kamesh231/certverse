'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface ConfidenceStepProps {
  certification: string;
  onNext: () => void;
}

// Topic configurations by certification
const TOPICS_BY_CERT: { [key: string]: Array<{ id: string; name: string; description: string; weight: number }> } = {
  'cisa': [
    {
      id: 'governance',
      name: 'Governance & Management of IT',
      description: 'IT governance, strategy, policies, and frameworks',
      weight: 21,
    },
    {
      id: 'risk_management',
      name: 'IT Risk Management',
      description: 'Risk assessment, mitigation, and monitoring',
      weight: 19,
    },
    {
      id: 'information_security',
      name: 'Information Security',
      description: 'Security controls, encryption, and access management',
      weight: 26,
    },
    {
      id: 'it_operations',
      name: 'IT Operations & Support',
      description: 'Infrastructure, service management, and resilience',
      weight: 18,
    },
    {
      id: 'compliance',
      name: 'Compliance & Audit Process',
      description: 'Audit planning, evidence gathering, and reporting',
      weight: 16,
    },
  ],
  'aws-saa': [
    {
      id: 'compute',
      name: 'Compute',
      description: 'EC2, Lambda, ECS, Auto Scaling',
      weight: 20,
    },
    {
      id: 'storage',
      name: 'Storage',
      description: 'S3, EBS, EFS, Storage Gateway',
      weight: 15,
    },
    {
      id: 'databases',
      name: 'Databases',
      description: 'RDS, DynamoDB, Aurora, ElastiCache',
      weight: 15,
    },
    {
      id: 'networking',
      name: 'Networking & Content Delivery',
      description: 'VPC, CloudFront, Route 53, Load Balancing',
      weight: 20,
    },
    {
      id: 'security',
      name: 'Security & Compliance',
      description: 'IAM, KMS, WAF, Shield, Security Groups',
      weight: 20,
    },
    {
      id: 'monitoring',
      name: 'Monitoring & Management',
      description: 'CloudWatch, CloudTrail, Config, Systems Manager',
      weight: 10,
    },
  ],
  'cka': [
    {
      id: 'architecture',
      name: 'Cluster Architecture',
      description: 'Control plane, nodes, API server, etcd',
      weight: 25,
    },
    {
      id: 'workloads',
      name: 'Workloads & Scheduling',
      description: 'Deployments, DaemonSets, StatefulSets, Jobs',
      weight: 15,
    },
    {
      id: 'services_networking',
      name: 'Services & Networking',
      description: 'Services, Ingress, Network Policies, DNS',
      weight: 20,
    },
    {
      id: 'storage',
      name: 'Storage',
      description: 'Volumes, PersistentVolumes, StorageClasses',
      weight: 10,
    },
    {
      id: 'troubleshooting',
      name: 'Troubleshooting',
      description: 'Debugging, logs, monitoring, cluster issues',
      weight: 30,
    },
  ],
};

export default function ConfidenceStep({ certification, onNext }: ConfidenceStepProps) {
  const { user } = useUser();
  const [ratings, setRatings] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);

  // Always use CISA topics for now
  const topics = TOPICS_BY_CERT['cisa'];

  const handleRatingChange = (topicId: string, rating: number) => {
    setRatings({ ...ratings, [topicId]: rating });
  };

  const getRatingFeedback = (rating: number) => {
    if (rating <= 3) return { text: "We'll focus on building your foundation here", color: 'text-red-600', bg: 'bg-red-50' };
    if (rating <= 6) return { text: "We'll help strengthen this area", color: 'text-yellow-600', bg: 'bg-yellow-50' };
    return { text: "Great! We'll challenge you here", color: 'text-green-600', bg: 'bg-green-50' };
  };

  const allTopicsRated = topics.every(topic => ratings[topic.id] !== undefined);

  const handleSubmit = async () => {
    if (!allTopicsRated) {
      alert('Please rate all topics');
      return;
    }

    setLoading(true);

    try {
      await fetch('/api/onboarding/confidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'cisa', // Always use CISA for now
          ratings,
        }),
      });

      onNext();
    } catch (error) {
      console.error('Error saving confidence ratings:', error);
      alert('Failed to save ratings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          How confident are you? 🎯
        </h2>
        <p className="text-gray-600">
          Rate your confidence for each topic area (1-10). Be honest - this helps us personalize your experience!
        </p>
      </div>

      <div className="space-y-6">
        {topics.map((topic, index) => (
          <div
            key={topic.id}
            className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors duration-200"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="mb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{topic.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                  <span className="inline-block mt-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {topic.weight}% of exam
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Not Confident</span>
                <span>Very Confident</span>
              </div>

              <div className="grid grid-cols-10 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleRatingChange(topic.id, num)}
                    className={`
                      aspect-square rounded-lg font-semibold transition-all duration-200
                      ${ratings[topic.id] === num
                        ? 'bg-blue-600 text-white shadow-lg scale-110 ring-2 ring-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:scale-105'
                      }
                    `}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {ratings[topic.id] !== undefined && (
                <div className={`p-3 rounded-lg ${getRatingFeedback(ratings[topic.id]).bg} animate-fadeIn`}>
                  <p className={`text-sm font-medium ${getRatingFeedback(ratings[topic.id]).color}`}>
                    {getRatingFeedback(ratings[topic.id]).text}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between p-4 bg-blue-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Progress: {Object.keys(ratings).length} of {topics.length} topics rated
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(Object.keys(ratings).length / topics.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={handleSubmit}
          disabled={!allTopicsRated || loading}
          className="w-full md:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
        >
          {loading ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </div>
  );
}
