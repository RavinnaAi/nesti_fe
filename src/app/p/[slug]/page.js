import { notFound } from 'next/navigation';
import { getPublicProfile } from '@/lib/publicProfileClient';
import PublicProfileLayout from '@/components/public-profile/PublicProfileLayout';
import AgentLandingPage from '@/components/public-profile/agent/AgentLandingPage';
import BrokerLandingPage from '@/components/public-profile/mortgage-broker/BrokerLandingPage';
import LawyerLandingPage from '@/components/public-profile/lawyer/LawyerLandingPage';

export async function generateMetadata({ params }) {
  try {
    const data = await getPublicProfile(params.slug);
    const profile = data.profile;

    const title = profile.seo_meta?.title || 
      `${profile.professional_name} - ${profile.professional_type === 'agent' ? 'Real Estate Agent' : profile.professional_type === 'mortgage_broker' ? 'Mortgage Broker' : 'Real Estate Lawyer'}`;
    
    const description = profile.seo_meta?.description || 
      profile.tagline || 
      profile.about?.substring(0, 160) || 
      `Connect with ${profile.professional_name}, a trusted ${profile.professional_type} professional.`;

    return {
      title,
      description,
      keywords: profile.seo_meta?.keywords || [],
      openGraph: {
        title,
        description,
        images: profile.cover_photo_url ? [profile.cover_photo_url] : [],
      },
    };
  } catch (error) {
    return {
      title: 'Profile Not Found',
      description: 'This professional profile could not be found.',
    };
  }
}

export default async function PublicProfilePage({ params }) {
  let data;
  
  try {
    data = await getPublicProfile(params.slug);
  } catch (error) {
    notFound();
  }

  const profile = data.profile;

  if (!profile || !profile.enabled) {
    notFound();
  }

  const professionalType = profile.professional_type;

  return (
    <PublicProfileLayout profile={profile}>
      {professionalType === 'agent' && <AgentLandingPage profile={profile} />}
      {professionalType === 'mortgage_broker' && <BrokerLandingPage profile={profile} />}
      {professionalType === 'lawyer' && <LawyerLandingPage profile={profile} />}
    </PublicProfileLayout>
  );
}
