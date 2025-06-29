import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { Message } from '../types/story';
import { TypingIndicator } from './TypingIndicator';
import { Check, CheckCheck } from 'lucide-react-native';
import { ThemeColors } from '../hooks/useTheme';

interface ChatBubbleProps {
  message: Message;
  isPlayer: boolean;
  characterAvatar?: string;
  onImagePress?: (url: string) => void;
  colors: ThemeColors;
}

export function ChatBubble({ message, isPlayer, characterAvatar, onImagePress, colors }: ChatBubbleProps) {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (message.isTyping) {
    return (
      <View style={[styles.messageContainer, styles.receivedMessage]}>
        {characterAvatar && (
          <Image source={{ uri: characterAvatar }} style={styles.avatar} />
        )}
        <View style={[styles.bubble, styles.receivedBubble, { backgroundColor: colors.card }]}>
          <TypingIndicator />
        </View>
      </View>
    );
  }

  return (
    <View style={[
      styles.messageContainer,
      isPlayer ? styles.sentMessage : styles.receivedMessage
    ]}>
      {!isPlayer && characterAvatar && (
        <Image source={{ uri: characterAvatar }} style={styles.avatar} />
      )}
      
      <View style={[
        styles.bubble,
        isPlayer ? [styles.sentBubble, { backgroundColor: colors.primary }] : [styles.receivedBubble, { backgroundColor: colors.card }]
      ]}>
        {message.type === 'image' && message.imageUrl && (
          <Pressable onPress={() => onImagePress?.(message.imageUrl!)}>
            <Image source={{ uri: message.imageUrl }} style={styles.messageImage} />
          </Pressable>
        )}
        
        {message.text && (
          <Text style={[
            styles.messageText,
            isPlayer ? styles.sentText : [styles.receivedText, { color: colors.text }]
          ]}>
            {message.text}
          </Text>
        )}
        
        <View style={styles.messageFooter}>
          <Text style={[
            styles.timestamp,
            isPlayer ? styles.sentTimestamp : [styles.receivedTimestamp, { color: colors.textSecondary }]
          ]}>
            {formatTime(message.timestamp)}
          </Text>
          
          {isPlayer && (
            <View style={styles.readStatus}>
              {message.isRead ? (
                <CheckCheck size={14} color={colors.primary} />
              ) : (
                <Check size={14} color={colors.textSecondary} />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    maxWidth: '75%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  sentBubble: {
    borderBottomRightRadius: 4,
  },
  receivedBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 2,
  },
  sentTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTimestamp: {
  },
  readStatus: {
    marginLeft: 4,
  },
});