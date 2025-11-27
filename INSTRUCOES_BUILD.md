# 📱 Instruções para Gerar o APK do I.M.I.F

## 🎯 Opção 1: Build com EAS (Recomendado - Mais Fácil)

### Passo 1: Instalar EAS CLI
```bash
npm install -g eas-cli
```

### Passo 2: Login no Expo
```bash
eas login
```
> Se você não tem conta Expo, crie uma gratuitamente em: https://expo.dev/signup

### Passo 3: Configurar o Projeto
```bash
eas build:configure
```

### Passo 4: Gerar o APK
```bash
eas build --platform android --profile preview
```

**O que vai acontecer:**
- O EAS vai fazer o build na nuvem (grátis)
- Você receberá um link para baixar o APK quando estiver pronto
- O processo leva cerca de 10-20 minutos
- O APK pode ser instalado diretamente em qualquer celular Android

---

## 🔧 Opção 2: Build Local (Mais Complexo)

### Requisitos:
- Android Studio instalado
- Java JDK 17
- Variáveis de ambiente configuradas (ANDROID_HOME, JAVA_HOME)

### Passos:

#### 1. Instalar dependências
```bash
npm install
```

#### 2. Fazer prebuild do Expo
```bash
npx expo prebuild --platform android
```

#### 3. Gerar o APK
```bash
cd android
./gradlew assembleRelease
```

O APK estará em: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📦 Informações do App

- **Nome:** I.M.I.F
- **Package:** com.igreja.imif
- **Versão:** 1.0.0

---

## ⚠️ Importante

### Firebase Configuration
Certifique-se de que o arquivo `.env.local` existe com suas credenciais do Firebase:
```
EXPO_PUBLIC_FIREBASE_API_KEY=sua_chave_aqui
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=seu_dominio_aqui
EXPO_PUBLIC_FIREBASE_PROJECT_ID=seu_projeto_aqui
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=seu_bucket_aqui
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id_aqui
EXPO_PUBLIC_FIREBASE_APP_ID=seu_app_id_aqui
```

### Para Publicar na Google Play Store
Se quiser publicar na Play Store, use:
```bash
eas build --platform android --profile production
```
Isso gerará um AAB (Android App Bundle) que é o formato exigido pela Play Store.

---

## 🆘 Problemas Comuns

### "eas: command not found"
```bash
npm install -g eas-cli
```

### "No Expo account found"
```bash
eas login
```

### Build falha
- Verifique se o `app.json` está correto
- Certifique-se de que todas as dependências estão instaladas
- Tente limpar o cache: `npm cache clean --force`

---

## 📞 Suporte

Para mais informações sobre EAS Build:
- Documentação: https://docs.expo.dev/build/introduction/
- Fórum: https://forums.expo.dev/
