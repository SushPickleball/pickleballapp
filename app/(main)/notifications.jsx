import Header from "@/components/Header";
import ScreenWrapper from "@/components/ScreenWrapper";
import { theme } from "@/constants/theme";
import { hp, wp } from "@/helpers/common";
import React from "react";
import { ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";

const Notifications = () => {
    return (
        <ScreenWrapper bg="white">
            <StatusBar barStyle="dark-content" backgroundColor="white" />
            
            <Header title="Notifications" />
            
            <ScrollView 
                style={styles.container}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.content}>
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyText}>No notifications yet</Text>
                        <Text style={styles.emptySubtext}>
                            You'll see your notifications here when you receive them
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </ScreenWrapper>
    )
}

export default Notifications;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    content: {
        flex: 1,
        paddingHorizontal: wp(4),
        paddingVertical: hp(3),
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: hp(10),
    },
    emptyText: {
        fontSize: theme.fontSizes.lg,
        fontWeight: '600',
        color: theme.colors.text.primary,
        textAlign: 'center',
        marginBottom: hp(1),
    },
    emptySubtext: {
        fontSize: theme.fontSizes.base,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: wp(8),
    },
})