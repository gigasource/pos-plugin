FROM registry.gigasource.io/pos-restaurant AS intermediate
ARG CONFIG_FILE_NAME
ARG BASE_VERSION
ARG FORCE_UPDATE
WORKDIR /root/cms-boilerplate
RUN mkdir -p /root/cms-boilerplate/storage
COPY ./ssh ./ssh
COPY ./gigasource-access-token ./gigasource-access-token

RUN rm -rf ~/.ssh && \
    mv ./ssh ~/.ssh && \
    chmod -R 700 ~/.ssh && \
    cd cms-configs && \
    git pull && \
    mv ./$CONFIG_FILE_NAME ../config/config.js

RUN export PATH=/root/.nvm/versions/node/v12.16.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/gradle/bin:/opt/kotlinc/bin:/opt/android-sdk/cmdline-tools/tools/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator && \
    cd plugins/pos-plugin/pkg && \
    git pull && \
    IS_NOT_VALID="$(node check-version.js)" && \
    if [ "$IS_NOT_VALID" = "true" ] ; then if [ "$FORCE_UPDATE" = "false" ] ; then echo "##################################################################\n#######################  VERSION EXISTED #########################\n##################################################################" && exit 1; fi ; fi

RUN export PATH=/root/.nvm/versions/node/v12.16.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/gradle/bin:/opt/kotlinc/bin:/opt/android-sdk/cmdline-tools/tools/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator && \
    GIGASOURCE_ACCESS_TOKEN=$(cat ./gigasource-access-token) && \
    cd cms && \
    git pull && \
    cd ../backoffice && \
    git pull && \
    npm run submodule-update && \
    rm -rf package-lock.json && \
    rm -rf node_modules && \
    npm install --unsafe-perm && \
    cd ../ && \
    rm -rf package-lock.json && \
    rm -rf node_modules && \
    npm install --unsafe-perm && \
    cd plugins/pos-plugin && \
    git pull && \
    npm install --unsafe-perm && \
    cd ../core-plugin && \
    git pull && \
    cd ../../ && \
    npm run install-plugins && \
    npm run build && \
    cd plugins/pos-plugin/pkg/android-dist/app && \
    curl -H "Authorization: token $GIGASOURCE_ACCESS_TOKEN" -H 'Accept: application/vnd.github.v3.raw' -O -L https://api.github.com/repos/gigasource/key-files/contents/pos-restaurant-android/release.keystore
RUN export PATH=/root/.nvm/versions/node/v12.16.2/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/opt/gradle/bin:/opt/kotlinc/bin:/opt/android-sdk/cmdline-tools/tools/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator && \
    cd plugins/pos-plugin/pkg && \
    npm install --unsafe-perm && \
    npm run build:android:dest && \
    cd android-dist && \
    rm -rf originalBuild && \
    mkdir originalBuild && \
    cp /pos-restaurant/app.apk ./originalBuild/ && \
    ./gradlew addPatchToApkProRelease && \
    /opt/android-sdk/build-tools/28.0.3/zipalign -f -v 4 /root/cms-boilerplate/plugins/pos-plugin/pkg/android-dist/originalBuild/pos-restaurant.apk /root/cms-boilerplate/plugins/pos-plugin/pkg/android-dist/originalBuild/temp.apk && \
    rm /root/cms-boilerplate/plugins/pos-plugin/pkg/android-dist/originalBuild/pos-restaurant.apk && \
    mv /root/cms-boilerplate/plugins/pos-plugin/pkg/android-dist/originalBuild/temp.apk /root/cms-boilerplate/plugins/pos-plugin/pkg/android-dist/originalBuild/pos-restaurant.apk && \
    ./gradlew uploadApkAndPatchProRelease -Dorg.gradle.internal.http.socketTimeout=300000 -Dhttp.connectionTimeout=300000
# Cleanup unused & sensitive files
WORKDIR /root/cms-boilerplate
RUN rm -rf ./backoffice && \
    rm -rf ./cms-configs && \
    rm -rf ~/.ssh
