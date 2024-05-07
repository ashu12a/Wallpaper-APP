import { View, Text, StyleSheet, Button, Platform, Pressable, Alert } from 'react-native'
import React from 'react'
import { BlurView } from 'expo-blur'
import { hp, wp } from '../../helpers/common'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { Image } from 'expo-image'
import { useState } from 'react'
import { theme } from '../../contants/theme'
import { Entypo, Octicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';


const ImageScreen = () => {
    const router = useRouter();
    const item = useLocalSearchParams();
    const [status, setStatus] = useState('loading');
    const uri = item?.webformatURL;
    const fileName = item?.previewURL?.split('/').pop();
    const imageUrl = uri;
    const filePath = `${FileSystem.documentDirectory}${fileName}`;


    const onLoad = () => {
        setStatus('');
    }

    const getSize = () => {
        const aspectRatio = item?.imageWidth / item?.imageHeight;
        const maxWidth = Platform.OS == 'web' ? wp(50) : wp(92);
        let calculateHeight = maxWidth / aspectRatio;
        let calculateWidth = maxWidth;

        if (aspectRatio < 1) {
            calculateWidth = calculateHeight * aspectRatio;
        }
        return {
            width: calculateWidth,
            height: calculateHeight
        }
    }

    const handleDownloadImage = async () => {
        setStatus('downloading');
        let uri = await downloadFile();
        if (uri) {
            showToast('Image Downloaded');
        }
    }

    const handleShareImage = async() => {
        setStatus('sharing');
        let uri = await downloadFile();
        if(uri){
            // share image
            await Sharing.shareAsync(uri);
        }
    }

    const downloadFile = async () => {
        try {
            const { uri } = await FileSystem.downloadAsync(imageUrl, filePath);
            setStatus('');
            return uri;
        } catch (err) {
            setStatus('');
            Alert.alert('Image', err?.message);
            return null;
        }
    }

    const showToast = (message) => {
        Toast.show({
          type: 'success',
          text1: message,
          position:'bottom'
        });
      }

      const ToastConfig = {
        success:({text1,props,...rest})=>{
            return (
                <View style={styles.toast}>
                    <Text style={styles.toastText}>{text1}</Text>
                </View>
            )
        }
      }

    return (
        <BlurView
            tint='dark'
            intensity={60}
            style={styles.container}
        >
            <View style={getSize()}>
                {
                    status == 'loading' &&
                    <View style={styles.loading}>
                        <Image
                            source={require('../../assets/images/loader.gif')}
                            style={styles.loader}
                        />
                    </View>
                }

                <Image
                    transition={100}
                    style={[styles.image, getSize()]}
                    source={uri}
                    onLoad={onLoad}
                />
            </View>
            {/* buttons */}
            <View style={styles.buttons}>
                <Animated.View entering={FadeInDown.springify()}>
                    <Pressable style={styles.button} onPress={() => router.back()}>
                        <Octicons name="x" size={24} color="white" />
                    </Pressable>
                </Animated.View>

                <Animated.View entering={FadeInDown.springify().delay(100)} >
                    {
                        status == 'downloading' ? (
                            <View style={styles.loading}>
                                <Image
                                    source={require('../../assets/images/loader.gif')}
                                    style={styles.loader}
                                />
                            </View>
                        ) : (
                            <Pressable style={styles.button} onPress={handleDownloadImage}>
                                <Octicons name="download" size={24} color="white" />
                            </Pressable>
                        )
                    }

                </Animated.View>

                <Animated.View entering={FadeInDown.springify().delay(200)} >
                    {
                        status == 'sharing' ? (
                            <View style={styles.loading}>
                                <Image
                                    source={require('../../assets/images/loader.gif')}
                                    style={styles.loader}
                                />
                            </View>
                        ) : (
                            <Pressable style={styles.button} onPress={handleShareImage}>
                                <Entypo name="share" size={24} color="white" />
                            </Pressable>
                        )
                    }

                </Animated.View>
            </View>
            <Toast config={ToastConfig} visibilityTime={2500}/>
        </BlurView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(4),
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    image: {
        borderRadius: theme.radius.lg,
        borderWidth: 2,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: 'rgba(255,255,255,0.1)'
    },
    loader: {
        width: 50,
        height: 50,
    },
    loading: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100
    },
    buttons: {
        marginTop: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 50
    },
    button: {
        height: hp(6),
        width: hp(6),
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.3)',
        borderRadius: theme.radius.lg,
        borderCurve: 'continuous'
    },
    toast:{
        padding:10,
        paddingHorizontal:30,
        borderRadius:theme.radius.xl,
        justifyContent:'center',
        alignItems:'center',
        backgroundColor:'rgba(255,255,255,0.15)'
    },
    toastText:{
        fontSize:hp(1.8),
        fontWeight:theme.fontWeights.semibold,
        color:theme.colors.white
    }
})

export default ImageScreen