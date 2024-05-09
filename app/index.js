import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { Text, View, StyleSheet, Image, Pressable } from 'react-native'
import { hp, wp } from '../helpers/common'
import { LinearGradient } from 'expo-linear-gradient'
import { theme } from '../contants/theme'
import { useRouter } from 'expo-router'

const WelcomeScreen = () => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            <StatusBar style='light' />
            <Image
                source={require('../assets/images/welcome.png')}
                style={styles.bgImage}
                resizeMode='cover'
            />
            {/* linear gradient  */}
            <View style={{ flex: 1 }}>
                <LinearGradient
                    colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'white', 'white']}
                    style={styles.gradient}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 0.8 }}
                />
                {/* content  */}
                <View style={styles.contentContainer}>
                    <Text
                        style={styles.title}
                    >
                        Pixel
                    </Text>
                    <Text
                        style={styles.punchline}
                    >
                        Every Pixel Tells a Story
                    </Text>
                    <View
                    >
                        <Pressable style={styles.startButton} onPress={() => router.push('home')}>
                            <Text style={styles.startText}>Start Explore</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    bgImage: {
        width: wp(100),
        height: hp(100),
        position: 'absolute'
    },
    gradient: {
        width: wp(100),
        height: hp(65),
        position: 'absolute',
        bottom: 0,
    },
    contentContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 14
    },
    title: {
        fontSize: hp(7),
        color: theme.colors.neutral(0.9),
        fontWeight: theme.fontWeights.bold,
    },
    punchline: {
        fontSize: hp(2),
        letterSpacing: 1,
        marginBottom: 10,
        fontWeight: theme.fontWeights.medium
    },
    startButton: {
        marginBottom: 50,
        backgroundColor: theme.colors.neutral(0.9),
        padding: 15,
        paddingHorizontal: 90,
        borderRadius: theme.radius.xl,
        borderCurve: 'continous'
    },
    startText: {
        color: theme.colors.white,
        fontSize: hp(3),
        fontWeight: theme.fontWeights.medium,
        letterSpacing: 1
    }
})
export default WelcomeScreen