import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Character } from '../types/story';
import { Lock, Circle } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

interface ContactListItemProps {
  character: Character;
  onPress: (characterId: string) => void;
  hasUnreadMessages?: boolean;
  lastMessage?: string;
  lastMessageTime?: Date;
}

export function ContactListItem({ 
  character, 
  onPress, 
  hasUnreadMessages, 
  lastMessage,
  lastMessageTime 
}: ContactListItemProps) {
  const { colors } = useTheme();

  const formatTime = (date: Date) => {
    // Convert string date to Date object if needed
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'now';
    }
    
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return 'now';
    }
  };

  if (!character.isUnlocked) {
    return (
      <View style={[styles.container, styles.lockedContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.avatarContainer}>
          <View style={[styles.lockedAvatar, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Lock size={20} color={colors.textSecondary} />
          </View>
        </View>
        <View style={styles.contentContainer}>
          <Text style={[styles.lockedName, { color: colors.textSecondary }]}>Locked Contact</Text>
          <Text style={[styles.lockedMessage, { color: colors.textSecondary }]}>Complete more of the story to unlock</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      onPress={() => onPress(character.id)}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: character.avatar }} style={styles.avatar} />
        {character.isOnline && (
          <View style={styles.onlineIndicator}>
            <Circle size={8} color="#4CAF50" fill="#4CAF50" />
          </View>
        )}
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.headerRow}>
          <Text style={[styles.name, hasUnreadMessages && styles.unreadName]}>
            <Text style={[styles.name, hasUnreadMessages && styles.unreadName, { color: colors.text }]}>
              {character.name}
            </Text>
          </Text>
          {lastMessageTime && (
            <Text style={[styles.time, { color: colors.textSecondary }]}>
              {formatTime(lastMessageTime)}
            </Text>
          )}
        </View>
        
        <Text style={[styles.lastMessage, hasUnreadMessages && styles.unreadMessage, { color: hasUnreadMessages ? colors.text : colors.textSecondary }]} numberOfLines={1}>
          {lastMessage || character.description}
        </Text>
      </View>
      
      {hasUnreadMessages && (
        <View style={styles.unreadBadge}>
          <Circle size={8} color={colors.primary} fill={colors.primary} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  lockedContainer: {
    opacity: 0.6,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  lockedAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#fff',
    borderRadius: 6,
    padding: 1,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
  },
  unreadName: {
    fontWeight: '700',
  },
  lockedName: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  lockedMessage: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  unreadBadge: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});