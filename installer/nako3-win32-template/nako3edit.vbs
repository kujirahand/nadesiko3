rem -----------------------
rem nako3edit execute script
rem -----------------------

Set fso = createObject("Scripting.FileSystemObject")
Set shell = WScript.CreateObject("WScript.Shell")
Set env = shell.Environment("Process")

dim home
dim path

home = fso.getParentFolderName(WScript.ScriptFullName)
path = _
  home & "\bin;" & _
  home & "\nodejs;" & _
  shell.ExpandEnvironmentStrings("%PATH%")

env.Item("NAKO_HOME") = home
env.Item("PATH") = path

shell.Run("node " & home & "\tools\nako3edit\run.js")
