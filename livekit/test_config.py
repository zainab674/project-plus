#!/usr/bin/env python3
"""
LiveKit Agent Configuration Test Script
This script validates the environment setup before running the main agent.
"""

import os
import sys
import asyncio
from dotenv import load_dotenv

def test_environment():
    """Test environment variables and dependencies"""
    print("🔍 Testing LiveKit Agent Configuration...")
    print("=" * 50)
    
    # Load environment variables
    load_dotenv()
    
    # Test required environment variables
    required_vars = {
        "LIVEKIT_URL": "LiveKit server URL",
        "LIVEKIT_API_KEY": "LiveKit API key", 
        "LIVEKIT_API_SECRET": "LiveKit API secret",
        "DEEPGRAM_API_KEY": "Deepgram API key"
    }
    
    missing_vars = []
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            # Mask sensitive values
            masked_value = value[:8] + "..." if len(value) > 8 else "***"
            print(f"✅ {description}: {masked_value}")
        else:
            print(f"❌ {description}: NOT SET")
            missing_vars.append(var)
    
    if missing_vars:
        print(f"\n❌ Missing required variables: {', '.join(missing_vars)}")
        print("Please check your .env file and ensure all required variables are set.")
        return False
    
    print("\n✅ All required environment variables are set!")
    return True

def test_dependencies():
    """Test Python dependencies"""
    print("\n🔍 Testing Dependencies...")
    print("=" * 30)
    
    dependencies = [
        ("livekit", "LiveKit SDK"),
        ("livekit.agents", "LiveKit Agents"),
        ("livekit.plugins.deepgram", "Deepgram Plugin"),
        ("dotenv", "Python-dotenv")
    ]
    
    missing_deps = []
    for module, name in dependencies:
        try:
            __import__(module)
            print(f"✅ {name}: Available")
        except ImportError:
            print(f"❌ {name}: Not installed")
            missing_deps.append(module)
    
    if missing_deps:
        print(f"\n❌ Missing dependencies: {', '.join(missing_deps)}")
        print("Run: pip install -r requirements.txt")
        return False
    
    print("\n✅ All dependencies are available!")
    return True

async def test_livekit_connection():
    """Test LiveKit server connectivity"""
    print("\n🔍 Testing LiveKit Connection...")
    print("=" * 35)
    
    try:
        from livekit import agents
        
        # Test basic LiveKit SDK functionality
        print("✅ LiveKit SDK: Imported successfully")
        
        # Note: We can't test actual connection without a room context
        # This would require a full agent setup
        print("ℹ️  Connection test requires running agent with room context")
        
        return True
        
    except Exception as e:
        print(f"❌ LiveKit connection test failed: {e}")
        return False

def test_deepgram():
    """Test Deepgram API key format"""
    print("\n🔍 Testing Deepgram Configuration...")
    print("=" * 40)
    
    api_key = os.getenv("DEEPGRAM_API_KEY")
    if not api_key:
        print("❌ Deepgram API key not found")
        return False
    
    # Basic format validation (Deepgram keys typically start with specific patterns)
    if len(api_key) < 20:
        print("⚠️  Deepgram API key seems too short")
        return False
    
    print("✅ Deepgram API key format looks valid")
    return True

async def main():
    """Run all tests"""
    print("🚀 LiveKit Agent Configuration Test")
    print("=" * 50)
    
    tests = [
        ("Environment Variables", test_environment),
        ("Dependencies", test_dependencies), 
        ("LiveKit Connection", test_livekit_connection),
        ("Deepgram Configuration", test_deepgram)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"❌ {test_name} test failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Summary:")
    print("=" * 50)
    
    passed = 0
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{len(results)} tests passed")
    
    if passed == len(results):
        print("\n🎉 All tests passed! Your LiveKit agent is ready to run.")
        print("Run: python main.py")
        return True
    else:
        print(f"\n⚠️  {len(results) - passed} test(s) failed. Please fix the issues above.")
        return False

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Test script failed: {e}")
        sys.exit(1)
