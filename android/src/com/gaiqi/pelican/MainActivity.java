package com.gaiqi.pelican;
import android.app.Activity;import android.os.Bundle;import android.view.View;import android.view.WindowManager;
import android.webkit.WebSettings;import android.webkit.WebView;import android.webkit.WebChromeClient;import android.webkit.WebViewClient;
public class MainActivity extends Activity{
  private WebView w;
  @Override protected void onCreate(Bundle b){super.onCreate(b);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    w=new WebView(this);setContentView(w);
    WebSettings s=w.getSettings();s.setJavaScriptEnabled(true);s.setDomStorageEnabled(true);s.setDatabaseEnabled(true);
    s.setAllowFileAccess(true);s.setAllowFileAccessFromFileURLs(true);s.setMediaPlaybackRequiresUserGesture(false);
    w.setWebViewClient(new WebViewClient());w.setWebChromeClient(new WebChromeClient());
    if(b!=null)w.restoreState(b);else w.loadUrl("file:///android_asset/index.html");hide();}
  private void hide(){getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY|View.SYSTEM_UI_FLAG_FULLSCREEN|View.SYSTEM_UI_FLAG_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_STABLE|View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION|View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);}
  @Override public void onWindowFocusChanged(boolean f){super.onWindowFocusChanged(f);if(f)hide();}
  @Override protected void onSaveInstanceState(Bundle o){super.onSaveInstanceState(o);w.saveState(o);}
  @Override protected void onPause(){super.onPause();w.onPause();}
  @Override protected void onResume(){super.onResume();w.onResume();}
  @Override public void onBackPressed(){if(w.canGoBack())w.goBack();else super.onBackPressed();}
}
