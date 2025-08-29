import { theme } from '@/constants/theme';
import { wp } from '@/helpers/common';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import LoadingState from './LoadingState';

const Button = ({ 
    title, 
    onPress, 
    variant = 'primary', 
    size = 'large',
    disabled = false,
    loading = false,
    loadingText,
    style,
    textStyle,
    ...props 
}) => {
    
    const getButtonStyle = () => {
        const baseStyle = [styles.button];
        
        switch (size) {
            case 'small':
                baseStyle.push(styles.small);
                break;
            case 'medium':
                baseStyle.push(styles.medium);
                break;
            case 'large':
            default:
                baseStyle.push(styles.large);
                break;
        }
        
        switch (variant) {
            case 'secondary':
                baseStyle.push(styles.secondary);
                break;
            case 'outline':
                baseStyle.push(styles.outline);
                break;
            case 'ghost':
                baseStyle.push(styles.ghost);
                break;
            case 'primary':
            default:
                baseStyle.push(styles.primary);
                break;
        }
        
        if (disabled && !loading) {
            baseStyle.push(styles.disabled);
        }
        
        if (style) {
            baseStyle.push(style);
        }
        
        return baseStyle;
    };
    
    const getTextStyle = () => {
        const baseTextStyle = [styles.text];
        
        switch (size) {
            case 'small':
                baseTextStyle.push(styles.textSmall);
                break;
            case 'medium':
                baseTextStyle.push(styles.textMedium);
                break;
            case 'large':
            default:
                baseTextStyle.push(styles.textLarge);
                break;
        }
        
        switch (variant) {
            case 'secondary':
                baseTextStyle.push(styles.textSecondary);
                break;
            case 'outline':
                baseTextStyle.push(styles.textOutline);
                break;
            case 'ghost':
                baseTextStyle.push(styles.textGhost);
                break;
            case 'primary':
            default:
                baseTextStyle.push(styles.textPrimary);
                break;
        }
        
        if (disabled && !loading) {
            baseTextStyle.push(styles.textDisabled);
        }
        
        if (textStyle) {
            baseTextStyle.push(textStyle);
        }
        
        return baseTextStyle;
    };

    const isInteractionDisabled = disabled || loading;
    const displayText = title;

    return (
        <Pressable
            style={({ pressed }) => [
                ...getButtonStyle(),
                pressed && !isInteractionDisabled && styles.pressed
            ]}
            onPress={isInteractionDisabled ? undefined : onPress}
            disabled={isInteractionDisabled}
            {...props}
        >
            <View style={styles.buttonContent}>
                {loading ? (
                    <LoadingState 
                        size={20} 
                        color={variant === 'outline' || variant === 'ghost' 
                            ? theme.colors.accent 
                            : theme.colors.text.inverse
                        }
                        variant="spinner"
                    />
                ) : (
                    <Text style={getTextStyle()}>
                        {displayText}
                    </Text>
                )}
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        width: '100%',
    },

    // Size variants
    small: {
        paddingVertical: 12,
        paddingHorizontal: wp(6),
        borderRadius: 12,
    },
    
    medium: {
        paddingVertical: 15,
        paddingHorizontal: wp(8),
        borderRadius: 14,
    },
    
    large: {
        paddingVertical: 18,
        paddingHorizontal: wp(12),
        borderRadius: 16,
    },

    primary: {
        backgroundColor: theme.colors.accent,
        shadowColor: theme.colors.accent,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },

    secondary: {
        backgroundColor: theme.colors.text.primary,
        shadowColor: theme.colors.text.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },

    outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: theme.colors.accent,
    },

    ghost: {
        backgroundColor: 'transparent',
    },

    disabled: {
        backgroundColor: theme.colors.border,
        shadowOpacity: 0,
        elevation: 0,
    },

    pressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },

    text: {
        fontFamily: 'System',
        fontWeight: '600',
        letterSpacing: 0.5,
    },

    textSmall: {
        fontSize: theme.fontSizes.sm,
    },

    textMedium: {
        fontSize: theme.fontSizes.base,
    },

    textLarge: {
        fontSize: theme.fontSizes.lg,
    },

    textPrimary: {
        color: theme.colors.text.inverse,
    },

    textSecondary: {
        color: theme.colors.text.inverse,
    },

    textOutline: {
        color: theme.colors.accent,
    },

    textGhost: {
        color: theme.colors.accent,
    },

    textDisabled: {
        color: theme.colors.text.tertiary,
    },

    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },

    loadingSpinner: {
        marginRight: 8,
    },

    loadingText: {
        opacity: 0.8,
    },
});

export default Button;
