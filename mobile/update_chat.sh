#!/bin/bash
# Update both chat.jsx files to add Firebase auth

for dir in "app/(user)/(tabs)/messages" "app/(bsn)/(tabs)/messages"; do
  file="$dir/chat.jsx"
  if [ -f "$file" ]; then
    echo "Updating $file..."
    
    # Add imports if not present
    if ! grep -q "getFirebaseAuthToken" "$file"; then
      sed -i '/getConversationDetails,/a\  getFirebaseAuthToken,' "$file"
    fi
    
    if ! grep -q "signInWithBackendToken" "$file"; then
      sed -i "/from '@utils\/messageService';/a import { signInWithBackendToken } from '@config/firebase';" "$file"
    fi
    
    # Add firebaseAuthenticated state if not present
    if ! grep -q "firebaseAuthenticated" "$file"; then
      sed -i "/const \[currentUserImage, setCurrentUserImage\] = useState('');/a\  const [firebaseAuthenticated, setFirebaseAuthenticated] = useState(false);" "$file"
    fi
    
    echo "Updated $file"
  fi
done
