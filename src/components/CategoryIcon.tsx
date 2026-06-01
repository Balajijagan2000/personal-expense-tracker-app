import React from 'react';
import { Feather } from '@expo/vector-icons';

interface CategoryIconProps {
  name: string;
  color?: string;
  size?: number;
}

export default function CategoryIcon({ name, color = '#ffffff', size = 20 }: CategoryIconProps) {
  // Safe validation list of available Feather icons we support in selection
  const validIcons = [
    'coffee',
    'truck',
    'shopping-bag',
    'film',
    'zap',
    'home',
    'dollar-sign',
    'grid',
    'credit-card',
    'gift',
    'heart',
    'book',
    'activity',
    'smile',
    'briefcase',
    'tool',
  ];

  let iconName: any = name;
  if (!validIcons.includes(iconName)) {
    iconName = 'grid'; // Safe fallback
  }

  return <Feather name={iconName} size={size} color={color} />;
}
