import { View, Text, StyleSheet, Platform, Pressable, Alert } from 'react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import { hp, wp } from '../../helpers/common';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { theme } from '../../contants/theme';
import { Entypo, Octicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Toast from 'react-native-toast-message';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

const rewardedAdUnitId = 'ca-app-pub-1054886942898046/6474323908'; // your Android rewarded id

const ImageScreen = () => {
  const router = useRouter();
  const item = useLocalSearchParams();

  const [status, setStatus] = useState('loading');
  const [rewardedLoaded, setRewardedLoaded] = useState(false);
  const [isShowingRewarded, setIsShowingRewarded] = useState(false);
  const [isRewardedLoading, setIsRewardedLoading] = useState(false);

  const pendingActionRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);

  const uri = item?.webformatURL;
  const fileName =
    item?.previewURL?.split('/').pop() ||
    item?.webformatURL?.split('/').pop() ||
    `image_${Date.now()}.jpg`;

  const imageUrl = uri;
  const filePath = `${FileSystem.documentDirectory}${fileName}`;

  const rewarded = useMemo(() => {
    return RewardedAd.createForAdRequest(rewardedAdUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
  }, []);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleRewardedLoad = (delayMs = 0) => {
    clearRetryTimer();

    retryTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) return;
      if (rewardedLoaded || isRewardedLoading || isShowingRewarded) return;

      try {
        setIsRewardedLoading(true);
        rewarded.load();
      } catch (e) {
        setIsRewardedLoading(false);
        console.log('Rewarded load call failed:', e);
      }
    }, delayMs);
  };

  useEffect(() => {
    isMountedRef.current = true;

    const unsubscribeLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        if (!isMountedRef.current) return;
        setRewardedLoaded(true);
        setIsRewardedLoading(false);
        retryCountRef.current = 0;
      }
    );

    const unsubscribeEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async () => {
        const action = pendingActionRef.current;
        pendingActionRef.current = null;

        if (action === 'download') {
          await performDownload();
        }
      }
    );

    const unsubscribeClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        if (!isMountedRef.current) return;

        setIsShowingRewarded(false);
        setRewardedLoaded(false);
        setIsRewardedLoading(false);

        // Load next rewarded ad after a short pause.
        scheduleRewardedLoad(3000);
      }
    );

    const unsubscribeError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (error) => {
        if (!isMountedRef.current) return;

        console.log('Rewarded ad failed:', error);

        setIsShowingRewarded(false);
        setRewardedLoaded(false);
        setIsRewardedLoading(false);

        // Exponential-ish backoff: 5s, 10s, 20s, max 30s
        retryCountRef.current += 1;
        const delay = Math.min(5000 * Math.pow(2, retryCountRef.current - 1), 30000);

        // Clear pending action so user can tap again later
        pendingActionRef.current = null;

        // Friendly message for user
        showToast('Reward ad not available right now');

        scheduleRewardedLoad(delay);
      }
    );

    // Initial preload
    scheduleRewardedLoad(1000);

    return () => {
      isMountedRef.current = false;
      clearRetryTimer();
      unsubscribeLoaded();
      unsubscribeEarned();
      unsubscribeClosed();
      unsubscribeError();
    };
  }, [rewarded, rewardedLoaded, isRewardedLoading, isShowingRewarded]);

  const onLoad = () => {
    setStatus('');
  };

  const getSize = () => {
    const aspectRatio = item?.imageWidth / item?.imageHeight;
    const maxWidth = Platform.OS === 'web' ? wp(50) : wp(92);

    let calculateHeight = maxWidth / aspectRatio;
    let calculateWidth = maxWidth;

    if (aspectRatio < 1) {
      calculateWidth = calculateHeight * aspectRatio;
    }

    return {
      width: calculateWidth,
      height: calculateHeight,
    };
  };

  const downloadFile = async () => {
    try {
      const { uri } = await FileSystem.downloadAsync(imageUrl, filePath);
      setStatus('');
      return uri;
    } catch (err) {
      setStatus('');
      Alert.alert('Image', err?.message || 'Download failed');
      return null;
    }
  };

  const performDownload = async () => {
    setStatus('downloading');
    const downloadedUri = await downloadFile();

    if (downloadedUri) {
      showToast('Image Downloaded');
    }
  };

  const handleDownloadImage = async () => {
    if (status === 'downloading' || isShowingRewarded) return;

    // If ad is ready, show it.
    if (rewardedLoaded) {
      pendingActionRef.current = 'download';
      setIsShowingRewarded(true);

      try {
        await rewarded.show();
      } catch (e) {
        setIsShowingRewarded(false);
        pendingActionRef.current = null;
        showToast('Unable to show reward ad');
      }
      return;
    }

    // If not ready, do not spam load again.
    if (!isRewardedLoading) {
      scheduleRewardedLoad(0);
    }

    showToast('Reward ad is loading, try again in a few seconds');
  };

  const handleShareImage = async () => {
    setStatus('sharing');
    const downloadedUri = await downloadFile();

    if (downloadedUri) {
      await Sharing.shareAsync(downloadedUri);
      setStatus('');
    }
  };

  const showToast = (message) => {
    Toast.show({
      type: 'success',
      text1: message,
      position: 'bottom',
    });
  };

  const ToastConfig = {
    success: ({ text1 }) => {
      return (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{text1}</Text>
        </View>
      );
    },
  };

  return (
    <BlurView tint="dark" intensity={60} style={styles.container}>
      <View style={getSize()}>
        {status === 'loading' && (
          <View style={styles.loading}>
            <Image
              source={require('../../assets/images/loader.gif')}
              style={styles.loader}
            />
          </View>
        )}

        <Image
          transition={100}
          style={[styles.image, getSize()]}
          source={uri}
          onLoad={onLoad}
        />
      </View>

      <View style={styles.buttons}>
        <Animated.View entering={FadeInDown.springify()}>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Octicons name="x" size={24} color="white" />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(100)}>
          {status === 'downloading' || isShowingRewarded || isRewardedLoading ? (
            <View style={styles.loadingButton}>
              <Image
                source={require('../../assets/images/loader.gif')}
                style={styles.loaderSmall}
              />
            </View>
          ) : (
            <Pressable style={styles.button} onPress={handleDownloadImage}>
              <Octicons name="download" size={24} color="white" />
            </Pressable>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.springify().delay(200)}>
          {status === 'sharing' ? (
            <View style={styles.loadingButton}>
              <Image
                source={require('../../assets/images/loader.gif')}
                style={styles.loaderSmall}
              />
            </View>
          ) : (
            <Pressable style={styles.button} onPress={handleShareImage}>
              <Entypo name="share" size={24} color="white" />
            </Pressable>
          )}
        </Animated.View>
      </View>

      <Toast config={ToastConfig} visibilityTime={2500} />
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  image: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  loader: {
    width: 50,
    height: 50,
  },
  loaderSmall: {
    width: 28,
    height: 28,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  loadingButton: {
    height: hp(6),
    width: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: theme.radius.lg,
  },
  buttons: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 50,
  },
  button: {
    height: hp(6),
    width: hp(6),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: theme.radius.lg,
    borderCurve: 'continuous',
  },
  toast: {
    padding: 10,
    paddingHorizontal: 30,
    borderRadius: theme.radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  toastText: {
    fontSize: hp(1.8),
    fontWeight: theme.fontWeights.semibold,
    color: theme.colors.white,
  },
});

export default ImageScreen;