import React, { Component } from 'react';
import { bindAll } from 'lodash';
import { EditorState, convertToRaw, ContentState, SelectionState } from 'draft-js';
import { Editor, defaultToolbar } from 'react-draft-wysiwyg';
import draftToHtml from 'draftjs-to-html';
import htmlToDraft from 'html-to-draftjs';
import { formatLineBreak } from '../utils/misc';

const MIN_ROWS    = 5;
const LINE_HEIGHT = 20;

class RichTextInput extends Component {

  constructor(props) {
    super(props);

    var value = props.data.settings[props.setting.id];
    if (value === undefined) value = props.setting.default || '';

    this.state = {
      editorState: this.createEditorContent(value),
      value
    };

    bindAll(this, 'inputOnChangeSanitizer', 'editorOnChangeSanitizer');
  }

  componentDidMount() {
    const { setting }   = this.props;
    const editorElement = this.input.querySelector('.draftjs-editor');

    if (editorElement)
      editorElement.style.height = `${(setting.nb_rows || MIN_ROWS) * LINE_HEIGHT}px`;
  }

  createEditorContent(html) {
    const { contentBlocks, entityMap } = htmlToDraft(html);
    const contentState = ContentState.createFromBlockArray(contentBlocks, entityMap);
    return EditorState.createWithContent(contentState);
  }

  inputOnChangeSanitizer(event) {
    if (event.target)
      this.updateSectionValue(event.target.value);
  }

  editorOnChangeSanitizer(editorState) {
    this.setState({ editorState });

    var value = draftToHtml(convertToRaw(editorState.getCurrentContent()));

    if (this.props.setting.line_break)
      value = formatLineBreak(value)

    this.updateSectionValue(value);
  };

  updateSectionValue(value) {
    this.setState({ value }, () => {
      this.props.onChange(this.props.setting.type, this.props.setting.id, value)
    });
  }

  render() {
    const { setting } = this.props;

    return (
      <div className="editor-input editor-input-text" ref={el => this.input = el}>
        <label>{setting.label}</label>
          {setting.html ? (
            <Editor
              editorState={this.state.editorState}
              wrapperClassName="draftjs-wrapper"
              editorClassName="draftjs-editor"
              toolbarClassName="draftjs-toolbar"
              toolbar={RichTextInput.mytoolbar(setting.line_break !== true)}
              onEditorStateChange={this.editorOnChangeSanitizer}
            />
          ) : (
            <div>
              <input type="text" value={this.state.value} onChange={this.inputOnChangeSanitizer} />
            </div>
          )}
      </div>
    );
  }
}

RichTextInput.mytoolbar = extended => {
  const options = extended ?
    ['inline', 'textAlign', 'list', 'link', 'image'] :
    ['inline', 'link'];

  return Object.assign({
    options,
    inline: {
      options: ['bold', 'italic', 'underline', 'strikethrough']
    },
    textAlign: {
      options: ['left', 'center', 'right', 'justify']
    },
    list: {
      options: ['unordered', 'ordered']
  } }, defaultToolbar);
};

export default RichTextInput;
