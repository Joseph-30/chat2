import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Character } from '../types/story';
import { Lock, Circle } from 'lucide-react-native';

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
      <View style={[styles.container, styles.lockedContainer]}>
        <View style={styles.avatarContainer}>
          <View style={styles.lockedAvatar}>
            <Lock size={20} color="#999" />
          </View>
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.lockedName}>Locked Contact</Text>
          <Text style={styles.lockedMessage}>Complete more of the story to unlock</Text>
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={styles.container}
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
            {character.name}
          </Text>
          {lastMessageTime && (
            <Text style={styles.time}>
              {formatTime(lastMessageTime)}
            </Text>
          )}
        </View>
        
        <Text style={[styles.lastMessage, hasUnreadMessages && styles.unreadMessage]} numberOfLines={1}>
          {lastMessage || character.description}
        </Text>
      </View>
      
      {hasUnreadMessages && (
        <View style={styles.unreadBadge}>
          <Circle size={8} color="#4A90E2" fill="#4A90E2" />
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
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
    color: '#000',
  },
  unreadName: {
    fontWeight: '700',
  },
  lockedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#000',
  },
  lockedMessage: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  unreadBadge: {
    alignSelf: 'center',
    marginLeft: 8,
  },
});