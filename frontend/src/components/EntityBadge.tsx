import React from 'react';

interface EntityBadgeProps {
  type: string;
  className?: string;
}

export const EntityBadge: React.FC<EntityBadgeProps> = ({ type, className = '' }) => {
  const getBadgeStyle = (entityType: string) => {
    switch (entityType) {
      case 'IN_PAN':
      case 'IN_AADHAAR':
      case 'US_SSN':
      case 'CREDIT_CARD':
      case 'IN_VOTER_ID':
        return 'bg-vault-crimsonBg text-vault-crimson border-vault-crimson/30';
      case 'EMAIL_ADDRESS':
      case 'IN_PHONE_NUMBER':
      case 'PHONE_NUMBER':
        return 'bg-vault-amberBg text-vault-amber border-vault-amber/30';
      case 'IP_ADDRESS':
      case 'URL':
      case 'LOCATION':
        return 'bg-vault-cyanBg text-vault-cyan border-vault-cyan/30';
      case 'IN_IFSC':
      case 'FINANCIAL_AMOUNT':
      case 'IBAN_CODE':
        return 'bg-vault-emeraldBg text-vault-emerald border-vault-emerald/30';
      case 'PERSON':
        return 'bg-vault-purpleBg text-vault-purple border-vault-purple/30';
      default:
        return 'bg-vault-blueBg text-vault-blue border-vault-blue/30';
    }
  };

  const formatName = (entityType: string) => {
    return entityType.replace('IN_', '').replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${getBadgeStyle(
        type
      )} ${className}`}
    >
      {formatName(type)}
    </span>
  );
};
